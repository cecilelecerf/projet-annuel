import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from "@api/errors";
import {
  createInternalMeetingSchema,
  MeetingId,
  MeetingRecurringId,
  UserId,
  type CreateInternalMeeting,
  type MeetingParticipantStatus,
  type UpdateInternalMeeting,
} from "@armali/schemas";
import { InternalMeetingRepository } from "./internal-meeting.repository";
import { UserRole } from "../../../prisma/generated/prisma/enums";
import { flatClinicId } from "@api/users/user.utils";
import { RecurringService } from "../recurring-meeting/recurring-meeting.service";

export class InternalMeetingService {
  constructor(
    private repository: InternalMeetingRepository,
    private recurringService: RecurringService,
  ) {}
  async create({
    data,
    userId,
    clinicId,
  }: {
    data: CreateInternalMeeting;
    userId: string;
    clinicId: string;
  }) {
    return this.repository.create({
      data,
      authorId: userId,
      clinicId,
    });
  }

  async update({
    id,
    data,
    userId,
    date,
    scope,
  }: {
    id: string;
    data: UpdateInternalMeeting;
    userId: string;
    date?: Date; // date de l'occurrence visée — requise dès qu'une récurrence est impliquée
    scope: "single" | "all";
  }) {
    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundError("Réunion");
    const isParticipant = existing.participants.some(
      (p) => p.userId === userId,
    );
    if (!isParticipant) throw new ForbiddenError();

    // Pas de récurrence : update simple, comportement inchangé
    if (!existing.recurringId) {
      return this.repository.update({ id: id as MeetingId, data });
    }

    if (!date) throw new BadRequestError("La date de l'occurrence est requise");

    // ── Scope "all" : délègue au split de série (ne touche que le futur) ────────
    if (scope === "all") {
      const hasInternalChanges =
        data.title !== undefined || data.description !== undefined;

      const recurring = await this.recurringService.update({
        id: existing.recurringId as MeetingRecurringId,
        data: {
          dateToStartAction: date,
          startTime: data.startTime,
          endTime: data.endTime,
          ...(hasInternalChanges && {
            internal: {
              title: data.title ?? existing.title,
              description: data.description ?? existing.description,
              userIds:
                data.userIds ??
                (existing.participants.map((p) => p.userId) as UserId[]),
            },
          }),
        },
      });
      return await this.repository.findById(recurring.id);
    }

    // ── Scope "single" : override + exception sur la date d'origine ─────────────
    if (!existing.recurring) throw new NotFoundError("Recurring");

    const isRescheduling =
      data.date !== undefined ||
      data.startTime !== undefined ||
      data.endTime !== undefined;

    const parsed = createInternalMeetingSchema.safeParse({
      title: data.title ?? existing.title,
      description: data.description ?? existing.description,
      date: data.date ?? date,
      startTime: data.startTime ?? existing.recurring.startTime.toISOString(),
      endTime: data.endTime ?? existing.recurring.endTime.toISOString(),
      clinicId: existing.clinicId,
      userIds: existing.participants.map((p) => p.userId),
      parentId: existing.recurring.id,
    });
    if (!parsed.success) throw new ConflictError("Champs manquants");
    const isMaterializedOverride = existing.meetingId !== null;

    if (isMaterializedOverride) {
      const internalMeeting = await this.repository.update({
        id, // le MeetingBase.id reçu en paramètre, pas existing.id
        data: {
          date: parsed.data.date,
          startTime: parsed.data.startTime,
          endTime: parsed.data.endTime,
        },
      });

      if (!isRescheduling && internalMeeting) {
        await this.repository.copyParticipantStatuses({
          targetInternalMeetingId: internalMeeting.id,
          sourceParticipants: existing.participants,
        });
      }

      return this.repository.findById(internalMeeting.id);
    } else {
      // Occurrence encore virtuelle : il faut poser une exception pour
      // empêcher RRule de régénérer l'occurrence par défaut à cette date
      await this.repository.createException({
        parentId: existing.recurring!.id as MeetingRecurringId,
        date,
        startTime: existing.recurring!.startTime,
        endTime: existing.recurring!.endTime,
      });
      const internalMeeting = await this.repository.create({
        data: parsed.data,
        authorId: existing.adminId,
        clinicId: existing.clinicId,
      });

      if (!isRescheduling && internalMeeting.internalMeeting) {
        await this.repository.copyParticipantStatuses({
          targetInternalMeetingId: internalMeeting.internalMeeting.id,
          sourceParticipants: existing.participants,
        });
      }
      return this.repository.findById(internalMeeting.id);
    }
  }

  async delete({
    id,
    userId,
    scope,
    date,
  }: {
    id: string;
    userId: string;
    scope: "single" | "all";
    date?: Date;
  }) {
    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundError("Réunion");
    if (existing.adminId !== userId) throw new ForbiddenError();

    // Pas de récurrence : suppression simple, scope/date sans objet ici
    if (!existing.recurringId) {
      return this.repository.delete(existing.id);
    }

    // À partir d'ici, on est forcément dans un cas récurrent → date requise
    if (!date) throw new BadRequestError("La date de l'occurrence est requise");

    if (scope === "all") {
      const dayBeforeDate = new Date(date);
      dayBeforeDate.setDate(dayBeforeDate.getDate() - 1);

      await this.repository.deleteFutureChildren(existing.recurringId, date);
      return this.repository.truncateRecurring(
        existing.recurringId,
        dayBeforeDate,
      );
    }

    if (!existing.recurring) throw new NotFoundError("Recurring");

    return this.repository.createException({
      parentId: existing.recurring.id as MeetingRecurringId,
      date,
      startTime: existing.recurring.startTime,
      endTime: existing.recurring.endTime,
    });
  }

  async getById({ id, role }: { id: string; role: UserRole }) {
    if (role === "CLIENT") throw new ForbiddenError();
    const meeting = await this.repository.findById(id);
    if (!meeting) throw new NotFoundError("Rendez-vous");
    return {
      ...meeting,
      participants: meeting.participants.map((participant) => ({
        ...participant,
        user: flatClinicId(participant.user),
      })),
    };
  }

  async updateParticipantStatus({
    meetingId,
    date,
    userId,
    status,
    scope,
  }: {
    meetingId: string; // peut être l'id d'un MeetingBase concret OU d'un MeetingReccuring
    date?: Date; // requis si scope === 'single' et que la réunion est récurrente
    userId: string;
    status: MeetingParticipantStatus;
    scope: "single" | "all";
  }) {
    const internalMeeting = await this.repository.findById(meetingId);
    if (!internalMeeting) throw new NotFoundError("Réunion");
    const participant = internalMeeting.participants.find(
      (p) => p.userId === userId,
    )!;
    if (!participant) throw new ForbiddenError();
    // ── Cas 1 : la réunion est déjà un MeetingBase concret (ponctuel ou override) ──
    if (internalMeeting && !internalMeeting?.recurringId) {
      const participant = await this.repository.findParticipant(
        internalMeeting.id,
        userId,
      );
      if (!participant) throw new ForbiddenError();

      return this.repository.updateParticipantStatus({
        userId: participant.userId,
        internalMeetingId: internalMeeting.id,
        status,
      });
    }

    // ── Cas 2 : meetingId correspond à une récurrence ──────────────────────────────

    // ── Scope "all" : on répond pour toute la série (statut par défaut) ───────────
    if (scope === "all") {
      return this.repository.updateParticipantStatus({
        internalMeetingId: internalMeeting.id,
        userId,
        status,
      });
    }

    // ── Scope "single" : on matérialise un override pour cette date uniquement ────
    if (!date) throw new BadRequestError("La date de l'occurrence est requise");
    if (!internalMeeting.recurring) throw new NotFoundError("Recurring");

    return this.repository.createOccurrenceOverride({
      internalMeeting: {
        ...internalMeeting,
        recurring: internalMeeting.recurring,
      },
      date,
      userId,
      status,
    });
  }
}
