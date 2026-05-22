import { prisma } from "@api/lib/prisma";
import type {
  CreateInternalMeeting,
  MeetingStatus,
  UpdateInternalMeeting,
} from "@armali/schemas";

export class InternalMeetingRepository {
  async findById(id: string) {
    return prisma.internalMeeting.findFirst({
      where: { OR: [{ meetingId: id }, { recurringId: id }] },
      include: {
        meeting: true,
        participants: { include: { user: true } },
      },
    });
  }

  async create({
    data,
    authorId,
    clinicId,
  }: {
    data: CreateInternalMeeting;
    authorId: string;
    clinicId: string;
  }) {
    return prisma.meetingBase.create({
      data: {
        kind: "INTERNAL",
        date: data.date,
        startTime: data.startTime,
        endTime: data.endTime,
        internalMeeting: {
          create: {
            title: data.title,
            description: data.description,
            clinicId: data.clinicId ?? clinicId,
            adminId: authorId,
            participants: {
              create: data.userIds?.map((userId) => ({
                userId,
                status: "PENDING",
              })),
            },
          },
        },
      },
      include: {
        internalMeeting: {
          include: { participants: true },
        },
      },
    });
  }

  async update({ id, data }: { id: string; data: UpdateInternalMeeting }) {
    return prisma.internalMeeting.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        meeting: {
          update: {
            date: data.date,
            startTime: data.startTime,
            endTime: data.endTime,
          },
        },
      },
      include: { meeting: true, participants: true },
    });
  }

  async delete(id: string) {
    return prisma.meetingBase.delete({ where: { id } });
  }

  async updateParticipantStatus({
    participantId,
    status,
  }: {
    participantId: string;
    status: MeetingStatus;
  }) {
    return prisma.internalMeetingParticipant.update({
      where: { id: participantId },
      data: { status },
    });
  }
}
