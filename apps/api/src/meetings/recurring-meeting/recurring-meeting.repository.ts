import { MeetingKind, UpdateRecurring } from "@armali/schemas";
import {
  MeetingReccuring,
  PrismaClient,
  Prisma,
} from "../../../prisma/generated/prisma/client";
import dayjs from "dayjs";

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
  animalMeeting: {
    select: {
      id: true,
      specialityId: true,
      animalId: true,
      veterinarianClinicId: true,
      veterinarianProfileId: true,
    },
  },
} satisfies Prisma.MeetingReccuringInclude;

type RecurringWithRelations = Prisma.MeetingReccuringGetPayload<{
  include: typeof recurringInclude;
}>;
type RecurringEditableFields = Omit<UpdateRecurring, "dateToActionStart">;

export class RecurringRepository {
  constructor(private prisma: PrismaClient) {}

  findById(id: string): Promise<RecurringWithRelations | null> {
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
        animalMeeting: true,
        internalMeeting: true,
      },
    });
  }

  // ── Split en 2 séries : ancienne (passé) + nouvelle (futur, avec les modifs) ─
  async splitFromDate(
    current: RecurringWithRelations,
    changes: Partial<
      RecurringEditableFields & { internal?: UpdateRecurring["internal"] } & {
        animal?: UpdateRecurring["animal"];
      }
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

      // 2. On crée la nouvelle série à partir du split, avec les modifs appliquées
      const newRecurringData = {
        dayOfWeek: changes.dayOfWeek ?? current.dayOfWeek,
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
          // ── Recrée l'entité liée selon le kind ───────────────────────────────
          ...(current.kind === "AVAILABILITY" &&
            current.availabilty && {
              availabilty: {
                create: {
                  userId: current.availabilty.userId,
                  clinicId: current.availabilty.clinicId,
                },
              },
            }),
          ...(current.kind === "INTERNAL" &&
            current.internalMeeting && {
              internalMeeting: {
                create: {
                  title:
                    changes.internal?.title ?? current.internalMeeting.title,
                  description:
                    changes.internal?.description ??
                    current.internalMeeting.description,
                  adminId: current.internalMeeting.adminId,
                  clinicId: current.internalMeeting.clinicId,
                  // Add change status if change date or hours
                  participants: {
                    create: current.internalMeeting.participants.map(
                      (participant) => ({
                        userId: participant.userId,
                        status: participant.status,
                      }),
                    ),
                  },
                },
              },
            }),
          ...(current.kind === "ANIMAL" &&
            current.animalMeeting && {
              animalMeeting: {
                create: {
                  specialityId: current.animalMeeting.specialityId,
                  animalId: current.animalMeeting.animalId,
                  veterinarianClinicId:
                    current.animalMeeting.veterinarianClinicId,
                  veterinarianProfileId:
                    current.animalMeeting.veterinarianProfileId,
                },
              },
            }),
        },
        include: {
          internalMeeting: true,
          animalMeeting: true,
          availabilty: true,
        },
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
}
