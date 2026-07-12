import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from "@api/errors";
import {
  ClinicId,
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
import { withAvatarUrl } from "@api/users/user.utils";
import { RecurringService } from "../recurring-meeting/recurring-meeting.service";
import { FlatMeeting } from "../meeting.service";
import { MeetingBaseWithSpecific, MeetingRecurringWithChildren } from "../type";
import { expandAll } from "../utils";
import { ClinicService } from "@api/clinics/clinic.service";
import { InternalMeetingParticipantRepository } from "./participant.repository";

export class InternalMeetingService {
  constructor(
    private repository: InternalMeetingRepository,
    private participantRepository: InternalMeetingParticipantRepository,
    private recurringService: RecurringService,
    private clinicService: ClinicService,
  ) {}

  async create({
    data,
    userId,
    role,
  }: {
    data: CreateInternalMeeting;
    userId: UserId;
    role: UserRole;
  }) {
    const clinicIds = await this.clinicService.getClinicIdsByUserId({
      userId,
      role,
    });
    if (!clinicIds.includes(data.clinicId)) throw new ForbiddenError();
    return this.repository.createPunctual({
      data,
      authorId: userId,
    });
  }

  async update({
    id,
    data,
    userId,
    originDate,
    scope,
  }: {
    id: string;
    data: UpdateInternalMeeting;
    userId: string;
    originDate?: Date;
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

    if (!originDate)
      throw new BadRequestError("La date de l'occurrence est requise");

    // ── Scope "all" : délègue au split de série (ne touche que le futur) ────────
    if (scope === "all") {
      const hasInternalChanges =
        data.title !== undefined || data.description !== undefined;
      const recurring = await this.recurringService.update({
        id: existing.recurringId as MeetingRecurringId,
        data: {
          dateToStartAction: originDate,
          startTime: data.startTime,
          endTime: data.endTime,
          dateStart: data.date,
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
      date: data.date ?? originDate,
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
        await this.participantRepository.copyStatus({
          targetInternalMeetingId: internalMeeting.id,
          sourceParticipants: existing.participants,
        });
      }

      return this.repository.findById(internalMeeting.id);
    } else {
      // Occurrence encore virtuelle : on re-fetch la récurrence complète
      // (avec internalMeeting/availabilty imbriqués) plutôt que de caster
      // existing.recurring, qui n'a que les colonnes scalaires brutes.
      const recurring = await this.recurringService.getById(
        existing.recurring.id as MeetingRecurringId,
      );
      const meetingBase = await this.recurringService.materializeOccurrence({
        recurring,
        originDate,
        targetDate: data.date ?? originDate,
      });
      if (!isRescheduling && meetingBase) {
        await this.participantRepository.copyStatus({
          targetInternalMeetingId: meetingBase.id,
          sourceParticipants: existing.participants,
        });
      }
      return this.repository.findById(meetingBase.id);
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

    const internal = {
      ...meeting,
      participants: meeting.participants.map((participant) => ({
        ...participant,
        user: {
          ...withAvatarUrl(participant.user),
          clinicId: meeting.clinicId,
        },
      })),
    };
    return internal;
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
      const participant = await this.participantRepository.findByKeys(
        internalMeeting.id,
        userId,
      );
      if (!participant) throw new ForbiddenError();

      return this.participantRepository.updateStatus({
        userId: participant.userId,
        internalMeetingId: internalMeeting.id,
        status,
      });
    }

    // ── Cas 2 : meetingId correspond à une récurrence ──────────────────────────────

    // ── Scope "all" : on répond pour toute la série (statut par défaut) ───────────
    if (scope === "all") {
      return this.participantRepository.updateStatus({
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

  async getAllByUser(userId: UserId) {
    return await this.repository.findByUser(userId);
  }
  async getFlatsByUser(
    userId: UserId,
    start: Date,
    end: Date,
    clinicIds?: ClinicId[],
  ): Promise<FlatMeeting[]> {
    const participants =
      await this.participantRepository.findByUserAndClinicIds(
        userId,
        start,
        end,
        clinicIds,
      );
    const flat = participants.flatMap(
      ({
        meeting: { recurring, meeting },
      }): (MeetingBaseWithSpecific | MeetingRecurringWithChildren)[] => {
        if (recurring) return [recurring as MeetingRecurringWithChildren];
        if (meeting) return [meeting as MeetingBaseWithSpecific];
        return [];
      },
    );
    return expandAll(flat, start, end);
  }
}
