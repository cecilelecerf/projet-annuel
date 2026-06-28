import { ForbiddenError, NotFoundError } from "@api/errors";
import type {
  CreateInternalMeeting,
  MeetingStatus,
  UpdateInternalMeeting,
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

    return internalMeetingRepository.update({ id, data });
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
