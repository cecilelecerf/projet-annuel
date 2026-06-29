import { ConflictError, ForbiddenError, NotFoundError } from "@api/errors";
import {
  createInternalMeetingSchema,
  MeetingId,
  MeetingRecurringId,
  type CreateInternalMeeting,
  type MeetingStatus,
  type UpdateInternalMeeting,
} from "@armali/schemas";
import { InternalMeetingRepository } from "./internal-meeting.repository";
import { UserRole } from "../../../prisma/generated/prisma/enums";
import { flatClinicId, flatUser } from "@api/users/user.utils";

const internalMeetingRepository = new InternalMeetingRepository();

export class InternalMeetingService {
  async create({
    data,
    userId,
    clinicId,
  }: {
    data: CreateInternalMeeting;
    userId: string;
    clinicId: string;
  }) {
    return internalMeetingRepository.create({
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
    const existing = await internalMeetingRepository.findById(id);
    if (!existing) throw new NotFoundError("Réunion");
    const isParticipant = existing.participants.some(
      (p) => p.userId === userId,
    );
    if (!isParticipant) throw new ForbiddenError();

    const isVirtualOccurrence = existing.recurringId === id;

    if (isVirtualOccurrence) {
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

      const internalMeeting = await internalMeetingRepository.create({
        data: parsed.data,
        authorId: existing.adminId,
        clinicId: existing.clinicId,
      });
      return internalMeetingRepository.findById(internalMeeting.id);
    }
    return internalMeetingRepository.update({ id: id as MeetingId, data });
  }

  async delete({ id, userId }: { id: string; userId: string }) {
    const existing = await internalMeetingRepository.findById(id);
    if (!existing) throw new NotFoundError("Réunion");

    if (existing.adminId !== userId) throw new ForbiddenError();

    return internalMeetingRepository.delete(id);
  }

  async updateParticipantStatus({
    meetingId,
    userId,
    status,
    requesterId,
  }: {
    meetingId: string;
    userId: string;
    status: MeetingStatus;
    requesterId: string;
  }) {
    if (userId !== requesterId) throw new ForbiddenError();

    const existing = await internalMeetingRepository.findById(meetingId);
    if (!existing) throw new NotFoundError("Réunion");

    const participant = existing.participants.find((p) => p.userId === userId);
    if (!participant) throw new NotFoundError("Participant");

    return internalMeetingRepository.updateParticipantStatus({
      participantId: participant.id,
      status,
    });
  }

  async getById({ id, role }: { id: string; role: UserRole }) {
    if (role === "CLIENT") throw new ForbiddenError();
    const meeting = await internalMeetingRepository.findById(id);
    if (!meeting) throw new NotFoundError("Rendez-vous");
    return {
      ...meeting,
      participants: meeting.participants.map((participant) => ({
        ...participant,
        user: flatClinicId(participant.user),
      })),
    };
  }
}
