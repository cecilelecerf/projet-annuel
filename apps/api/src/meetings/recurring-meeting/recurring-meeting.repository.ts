import {
  ClinicId,
  MeetingRecurringId,
  UpdateRecurring,
  UserId,
} from "@armali/schemas";
import {
  MeetingReccuring,
  PrismaClient,
  Prisma,
  MeetingStatus,
  MeetingKind,
} from "../../../prisma/generated/prisma/client";
import dayjs from "dayjs";
import { buildAvailabilityCreate, buildInternalMeetingCreate } from "./utils";

const recurringInclude = {
  availabilty: { select: { userId: true, clinicId: true } },
  internalMeeting: {
    select: {
      id: true,
      title: true,
      description: true,
      adminId: true,
      clinicId: true,
      participants: {
        select: {
          userId: true,
          status: true,
        },
      },
    },
  },
} satisfies Prisma.MeetingReccuringInclude;

export type RecurringWithRelations = Prisma.MeetingReccuringGetPayload<{
  include: typeof recurringInclude;
}>;
type RecurringEditableFields = Omit<UpdateRecurring, "dateToActionStart">;

export class RecurringRepository {
  constructor(private prisma: PrismaClient) {}

  findById(id: MeetingRecurringId): Promise<RecurringWithRelations | null> {
    return this.prisma.meetingReccuring.findUnique({
      where: { id },
      include: recurringInclude,
    });
  }

  update(
    id: string,
    data: Partial<RecurringEditableFields>,
  ): Promise<MeetingReccuring> {
    return this.prisma.meetingReccuring.update({
      where: { id },
      data,
      include: {
        availabilty: true,
        internalMeeting: true,
      },
    });
  }

  // ── Split en 2 séries : ancienne (passé) + nouvelle (futur, avec les modifs) ─
  async splitFromDate(
    current: RecurringWithRelations,
    changes: Partial<
      RecurringEditableFields & { internal?: UpdateRecurring["internal"] }
    >,
    splitDate: Date,
  ): Promise<MeetingReccuring> {
    // TODO : add utc in global app
    const dayBeforeSplit = dayjs(splitDate).subtract(1, "day").toDate();

    return this.prisma.$transaction(async (tx) => {
      // 1. On arrête l'ancienne série la veille du split
      await tx.meetingReccuring.update({
        where: { id: current.id },
        data: { dateEnd: dayBeforeSplit },
      });
      const datOfWeek = changes.dateStart?.getDay();
      // 2. On crée la nouvelle série à partir du split, avec les modifs appliquées
      const newRecurringData = {
        dayOfWeek: datOfWeek ? [datOfWeek] : current.dayOfWeek,
        startTime: changes.startTime ?? current.startTime,
        endTime: changes.endTime ?? current.endTime,
        frequency: changes.frequency ?? current.frequency,
        dateStart: splitDate,
        dateEnd: changes.dateEnd ?? current.dateEnd,
        kind: current.kind,
      };

      const newRecurring = await tx.meetingReccuring.create({
        data: {
          ...newRecurringData,
          ...(current.kind === "AVAILABILITY" &&
            current.availabilty && {
              availabilty: buildAvailabilityCreate(
                current.availabilty as { clinicId: ClinicId; userId: UserId },
              ),
            }),
          ...(current.kind === "INTERNAL" &&
            current.internalMeeting && {
              internalMeeting: buildInternalMeetingCreate({
                title: changes.internal?.title ?? current.internalMeeting.title,
                description:
                  changes.internal?.description ??
                  current.internalMeeting.description,
                adminId: current.internalMeeting.adminId as UserId,
                clinicId: current.internalMeeting.clinicId as ClinicId,
                participants: current.internalMeeting.participants as {
                  userId: UserId;
                  status: MeetingStatus;
                }[],
              }),
            }),
        },
        include: { internalMeeting: true, availabilty: true },
      });

      // 3. Bascule les exceptions futures vers la nouvelle série
      await tx.meetingBase.updateMany({
        where: {
          parentId: current.id,
          date: { gte: splitDate },
        },
        data: { parentId: newRecurring.id },
      });

      return newRecurring;
    });
  }

  async createException({
    parentId,
    date,
    startTime,
    endTime,
    kind,
  }: {
    parentId: MeetingRecurringId;
    date: Date;
    startTime: Date;
    endTime: Date;
    kind: MeetingKind;
  }) {
    return this.prisma.meetingBase.create({
      data: {
        kind,
        type: "EXCEPTION",
        date,
        startTime,
        endTime,
        parentId,
      },
    });
  }

  async createOccurrenceOverride({
    parentId,
    date,
    startTime,
    endTime,
    authorId,
    clinicId,
  }: {
    parentId: MeetingRecurringId;
    date: Date;
    startTime: Date;
    endTime: Date;
    authorId: string;
    clinicId: string;
  }) {
    return this.prisma.meetingBase.create({
      data: {
        kind: "AVAILABILITY" as const,
        type: "SPECIFIED" as const,
        date,
        startTime,
        endTime,
        parentId,
        availabilty: {
          create: { userId: authorId, clinicId },
        },
      },
      include: { availabilty: true },
    });
  }
}
