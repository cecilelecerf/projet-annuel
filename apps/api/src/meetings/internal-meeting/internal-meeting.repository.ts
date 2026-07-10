import { userWithProfileAndClinicIdInclude } from "@api/users/user.types";
import type {
  ClinicId,
  CreateInternalMeeting,
  MeetingParticipantStatus,
  MeetingRecurringId,
  UpdateInternalMeeting,
  UserId,
} from "@armali/schemas";
import {
  InternalMeeting,
  InternalMeetingParticipant,
  MeetingReccuring,
  PrismaClient,
} from "../../../prisma/generated/prisma/client";
import { buildInternalMeetingCreate } from "../recurring-meeting/utils";
export class InternalMeetingRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string) {
    return this.prisma.internalMeeting.findFirst({
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

  // C'est le meeting qui porte la fk donc pas le choix du sens
  async createPunctual({
    data,
    authorId,
    clinicId,
    parentId,
  }: {
    data: CreateInternalMeeting;
    authorId: UserId;
    clinicId?: ClinicId;
    parentId?: MeetingRecurringId;
  }) {
    console.log(data.date);
    return this.prisma.meetingBase.create({
      data: {
        kind: "INTERNAL",
        date: data.date,
        startTime: data.startTime,
        endTime: data.endTime,
        type: "SPECIFIED",
        parentId: parentId,
        internalMeeting: buildInternalMeetingCreate({
          title: data.title,
          description: data.description,
          adminId: authorId,
          clinicId: data.clinicId ?? clinicId,
          participants: (data.userIds ?? []).map((userId) => ({
            userId,
            status: "PENDING",
          })),
        }),
      },
      include: {
        internalMeeting: {
          include: { participants: true },
        },
      },
    });
  }

  async update({ id, data }: { id: string; data: UpdateInternalMeeting }) {
    return this.prisma.internalMeeting.update({
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
    return this.prisma.internalMeeting.delete({ where: { id } });
  }

  // Même principe de fk
  async createOccurrenceOverride({
    internalMeeting,
    date,
    userId,
    status,
  }: {
    internalMeeting: InternalMeeting & {
      recurring: MeetingReccuring;
      participants: InternalMeetingParticipant[];
    };
    date: Date;
    userId: string;
    status: MeetingParticipantStatus;
  }) {
    return this.prisma.meetingBase.create({
      data: {
        kind: "INTERNAL",
        type: "SPECIFIED",
        date,
        startTime: internalMeeting.recurring.startTime,
        endTime: internalMeeting.recurring.endTime,
        parentId: internalMeeting.recurring.id,
        internalMeeting: {
          create: {
            title: internalMeeting.title,
            description: internalMeeting.description,
            adminId: internalMeeting.adminId,
            clinicId: internalMeeting.clinicId,
            participants: {
              create: internalMeeting.participants.map((p) => ({
                userId: p.userId,
                status: p.userId === userId ? status : p.status,
              })),
            },
          },
        },
      },
      include: { internalMeeting: { include: { participants: true } } },
    });
  }

  async createException({
    parentId,
    date,
    startTime,
    endTime,
  }: {
    parentId: MeetingRecurringId;
    date: Date;
    startTime: Date;
    endTime: Date;
  }) {
    return this.prisma.meetingBase.create({
      data: {
        kind: "INTERNAL",
        type: "EXCEPTION",
        date,
        startTime,
        endTime,
        parentId,
      },
    });
  }

  async deleteRecurring(recurringId: string) {
    return this.prisma.meetingReccuring.delete({ where: { id: recurringId } });
  }

  async truncateRecurring(recurringId: string, dateEnd: Date) {
    return this.prisma.meetingReccuring.update({
      where: { id: recurringId },
      data: { dateEnd },
    });
  }

  async deleteFutureChildren(recurringId: string, fromDate: Date) {
    return this.prisma.meetingBase.deleteMany({
      where: { parentId: recurringId, date: { gte: fromDate } },
    });
  }

  async findByUser(userId: UserId) {
    return this.prisma.internalMeeting.findMany({
      where: {
        OR: [
          { adminId: userId },
          {
            participants: {
              some: {
                userId,
              },
            },
          },
        ],
      },
      include: { meeting: true, recurring: true },
    });
  }
}
