import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from "@api/errors";
import {
  createInternalMeetingSchema,
  MeetingId,
  type CreateInternalMeeting,
  type MeetingParticipantStatus,
  type UpdateInternalMeeting,
} from "@armali/schemas";
import { InternalMeetingRepository } from "./internal-meeting.repository";
import { UserRole } from "../../../prisma/generated/prisma/enums";
import { flatClinicId } from "@api/users/user.utils";
import { RecurringRepository } from "../recurring-meeting/recurring-meeting.repository";

export class InternalMeetingService {
  constructor(
    private repository: InternalMeetingRepository,
    private recurringRepository: RecurringRepository,
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
  }: {
    id: string;
    data: UpdateInternalMeeting;
    userId: string;
  }) {
    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundError("Réunion");
    const isParticipant = existing.participants.some(
      (p) => p.userId === userId,
    );
    if (!isParticipant) throw new ForbiddenError();

    const isVirtualOccurrence = existing.recurringId === id;

    if (isVirtualOccurrence) {
      const isRescheduling =
        data.date !== undefined ||
        data.startTime !== undefined ||
        data.endTime !== undefined;

      const parsed = createInternalMeetingSchema.safeParse({
        title: data.title ?? existing.title,
        description: data.description ?? existing.description,
        date: data.date,
        startTime:
          data.startTime ?? existing.recurring?.startTime.toISOString(),
        endTime: data.endTime ?? existing.recurring?.endTime.toISOString(),
        clinicId: existing.clinicId,
        userIds: existing.participants.map((p) => p.userId),
        parentId: id,
      });
      if (!parsed.success) throw new ConflictError("Champs manquants");

      const internalMeeting = await this.repository.create({
        data: parsed.data,
        authorId: existing.adminId,
        clinicId: existing.clinicId,
      });

      // ── Si le créneau n'a pas changé, on reporte les statuts existants ──────────
      if (!isRescheduling && internalMeeting.internalMeeting) {
        await this.repository.copyParticipantStatuses({
          targetInternalMeetingId: internalMeeting.internalMeeting.id,
          sourceParticipants: existing.participants,
        });
      }

      return this.repository.findById(internalMeeting.id);
    }
    return this.repository.update({ id: id as MeetingId, data });
  }

  async delete({ id, userId }: { id: string; userId: string }) {
    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundError("Réunion");

    if (existing.adminId !== userId) throw new ForbiddenError();

    return this.repository.delete(id);
  }

  async getById({ id, role }: { id: string; role: UserRole }) {
    if (role === "CLIENT") throw new ForbiddenError();
    const meeting = await this.repository.findById(id);
    console.log(meeting);
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
    console.log("enter");
    console.log(scope);

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
