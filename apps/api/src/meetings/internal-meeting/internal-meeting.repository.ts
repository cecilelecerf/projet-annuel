import { prisma } from "@api/lib/prisma";
import type {
  CreateInternalMeeting,
  MeetingStatus,
  UpdateInternalMeeting,
} from "@armali/schemas";

export class InternalMeetingRepository {
  async findById(id: string) {
    return prisma.internalMeeting.findUnique({
      where: { id },
      include: {
        base: true,
        participants: true,
      },
    });
  }

  async create({
    data,
    creatorId,
  }: {
    data: CreateInternalMeeting;
    creatorId: string;
  }) {
    const allParticipantIds = Array.from(
      new Set([creatorId, ...data.participantIds]),
    );

    return prisma.meetingBase.create({
      data: {
        type: data.type,
        kind: "INTERNAL",
        dayOfWeek: data.dayOfWeek,
        dateStart: data.dateStart,
        dateEnd: data.dateEnd,
        startTime: data.startTime,
        endTime: data.endTime,
        specificDate: data.specificDate,
        internalMeeting: {
          create: {
            title: data.title,
            description: data.description,
            clinicId: data.clinicId,
            participants: {
              create: allParticipantIds.map((userId) => ({
                userId,
                status: userId === creatorId ? "ACCEPTED" : "PENDING",
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
        base: {
          update: {
            dayOfWeek: data.dayOfWeek,
            dateStart: data.dateStart,
            dateEnd: data.dateEnd,
            startTime: data.startTime,
            endTime: data.endTime,
            specificDate: data.specificDate,
            type: data.type,
          },
        },
      },
      include: { base: true, participants: true },
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
