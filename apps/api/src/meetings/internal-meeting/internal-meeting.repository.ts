import { userWithProfileAndClinicIdInclude } from "@api/users/user.types";
import type {
  CreateInternalMeeting,
  MeetingParticipantStatus,
  UpdateInternalMeeting,
} from "@armali/schemas";
import {
  InternalMeeting,
  InternalMeetingParticipant,
  MeetingReccuring,
  PrismaClient,
} from "../../../prisma/generated/prisma/client";
import { RecurringWithRelations } from "../recurring-meeting/recurring-meeting.repository";

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

  async create({
    data,
    authorId,
    clinicId,
  }: {
    data: CreateInternalMeeting;
    authorId: string;
    clinicId: string;
  }) {
    return this.prisma.meetingBase.create({
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
    return this.prisma.meetingBase.delete({ where: { id } });
  }
  async findParticipant(internalMeetingId: string, userId: string) {
    return this.prisma.internalMeetingParticipant.findFirst({
      where: { meetingId: internalMeetingId, userId },
    });
  }
  async updateParticipantStatus({
    internalMeetingId,
    userId,
    status,
  }: {
    internalMeetingId: string;
    userId: string;
    status: MeetingParticipantStatus;
  }) {
    return this.prisma.internalMeetingParticipant.updateMany({
      where: { meetingId: internalMeetingId, userId },
      data: { status },
    });
  }
  async copyParticipantStatuses({
    targetInternalMeetingId,
    sourceParticipants,
  }: {
    targetInternalMeetingId: string;
    sourceParticipants: InternalMeetingParticipant[];
  }) {
    await this.prisma.$transaction(
      sourceParticipants.map((p) =>
        this.prisma.internalMeetingParticipant.updateMany({
          where: { meetingId: targetInternalMeetingId, userId: p.userId },
          data: { status: p.status },
        }),
      ),
    );
  }

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
}
