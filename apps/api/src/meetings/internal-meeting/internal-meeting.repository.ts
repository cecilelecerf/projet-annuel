import { prisma } from "@api/lib/prisma";
import { userWithProfileAndClinicIdInclude } from "@api/users/user.types";
import type {
  CreateInternalMeeting,
  MeetingId,
  MeetingRecurringId,
  MeetingStatus,
  UpdateInternalMeeting,
} from "@armali/schemas";

export class InternalMeetingRepository {
  async findById(id: string) {
    return prisma.internalMeeting.findFirst({
      where: { OR: [{ meetingId: id }, { recurringId: id }] },
      include: {
        meeting: true,
        recurring: true,
        participants: {
          include: { user: { include: userWithProfileAndClinicIdInclude } },
        },
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
        type: "SPECIFIED",
        parentId: data.parentId,
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
      where: { meetingId: id },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && {
          description: data.description,
        }),
        ...((data.date || data.startTime || data.endTime) && {
          meeting: {
            update: {
              data: {
                ...(data.date && { date: data.date }),
                ...(data.startTime && { startTime: data.startTime }),
                ...(data.endTime && { endTime: data.endTime }),
              },
            },
          },
        }),
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
