import {
  MeetingReccuring,
  PrismaClient,
  Prisma,
} from "../../../prisma/generated/prisma/client";

const recurringInclude = {
  availabilty: { select: { userId: true, clinicId: true } },
  internalMeeting: {
    select: {
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
type RecurringEditableFields = Pick<
  MeetingReccuring,
  "dayOfWeek" | "startTime" | "endTime" | "dateStart" | "dateEnd" | "frequency"
>;

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
    return this.prisma.meetingReccuring.update({ where: { id }, data });
  }

  // ── Split en 2 séries : ancienne (passé) + nouvelle (futur, avec les modifs) ─
  async splitFromDate(
    current: RecurringWithRelations,
    changes: Partial<RecurringEditableFields>,
    splitDate: Date,
  ): Promise<MeetingReccuring> {
    const dayBeforeSplit = new Date(splitDate);
    dayBeforeSplit.setUTCDate(dayBeforeSplit.getUTCDate() - 1);

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
                  title: current.internalMeeting.title,
                  description: current.internalMeeting.description,
                  adminId: current.internalMeeting.adminId,
                  clinicId: current.internalMeeting.clinicId,
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
