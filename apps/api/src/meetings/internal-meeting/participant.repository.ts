import type { ClinicId, MeetingParticipantStatus } from "@armali/schemas";
import {
  InternalMeetingParticipant,
  PrismaClient,
} from "../../../prisma/generated/prisma/client";
import {
  baseFilter,
  recurringFilter,
  recurringWithChildrenInclude,
} from "../meeting.repository";

export class InternalMeetingParticipantRepository {
  constructor(private prisma: PrismaClient) {}

  async findByKeys(internalMeetingId: string, userId: string) {
    return this.prisma.internalMeetingParticipant.findUnique({
      where: { userId_meetingId: { meetingId: internalMeetingId, userId } },
    });
  }
  async updateStatus({
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

  async copyStatus({
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

  async findByUserAndClinicIds(
    userId: string,
    start: Date,
    end: Date,
    clinicIds?: ClinicId[],
  ) {
    return this.prisma.internalMeetingParticipant.findMany({
      where: {
        userId,
        ...(clinicIds && { meeting: { clinicId: { in: clinicIds } } }),
      },
      include: {
        meeting: {
          include: {
            recurring: {
              where: recurringFilter(start, end),
              include: recurringWithChildrenInclude(start, end),
            },
            meeting: {
              where: { ...baseFilter(start, end), parentId: null },
              include: {
                internalMeeting: { include: { participants: true } },
              },
            },
          },
        },
      },
    });
  }
}
