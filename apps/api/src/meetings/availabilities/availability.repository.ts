import type {
  CreateAvailabilityException,
  CreatePunctualAvailability,
  CreateRecurringAvailability,
  UpdatePunctualAvailability,
  UpdateRecurringAvailability,
} from "@armali/schemas";
import {
  Availability,
  MeetingBase,
  PrismaClient,
  User,
} from "../../../prisma/generated/prisma/client";
import {
  baseFilter,
  recurringFilter,
  recurringWithChildrenInclude,
} from "../meeting.repository";

export class AvailabilityRepository {
  constructor(private prisma: PrismaClient) {}

  async findByUser({ userId, date }: { userId: User["id"]; date: Date }) {
    return this.prisma.availability.findMany({
      where: {
        userId,
        OR: [
          {
            recurringId: { not: null },
            recurring: { dateEnd: { gte: date } },
          },
          {
            meetingId: { not: null },
            meeting: { date: { gte: date } },
          },
        ],
      },
      include: { meeting: true, recurring: true, clinic: true },
    });
  }

  async findById(id: string) {
    return this.prisma.availability.findFirst({
      where: { OR: [{ meetingId: id }, { recurringId: id }, { id }] },
      include: { meeting: true, user: true, clinic: true },
    });
  }

  async createRecurring({
    data,
    authorId,
    clinicId,
  }: {
    data: CreateRecurringAvailability;
    authorId: string;
    clinicId: string;
  }) {
    return this.prisma.meetingReccuring.create({
      data: {
        kind: "AVAILABILITY" as const,
        frequency: data.frequency,
        dayOfWeek: data.dayOfWeek,
        startTime: data.startTime,
        endTime: data.endTime,
        dateStart: data.dateStart,
        dateEnd: data.dateEnd,
        availabilty: {
          create: {
            userId: authorId,
            clinicId,
          },
        },
      },
      include: { availabilty: true },
    });
  }

  async createPunctual({
    data,
    authorId,
    clinicId,
  }: {
    data: CreatePunctualAvailability;
    authorId: string;
    clinicId: string;
  }) {
    return this.prisma.meetingBase.create({
      data: {
        kind: "AVAILABILITY" as const,
        type: "SPECIFIED" as const,
        date: data.date,
        startTime: data.startTime,
        endTime: data.endTime,
        availabilty: {
          create: {
            userId: authorId,
            clinicId,
          },
        },
      },
      include: { availabilty: true },
    });
  }

  async createExeption({
    data,
    authorId,
    clinicId,
  }: {
    data: CreateAvailabilityException;
    authorId: string;
    clinicId: string;
  }) {
    return this.prisma.meetingBase.create({
      data: {
        kind: "AVAILABILITY" as const,
        type: "EXCEPTION" as const,
        date: data.date,
        startTime: data.startTime,
        endTime: data.endTime,
        parentId: data.parentId,
        availabilty: {
          create: {
            userId: authorId,
            clinicId,
          },
        },
      },
      include: { availabilty: true },
    });
  }

  async updatePunctual({
    id,
    data,
  }: {
    id: MeetingBase["id"];
    data: UpdatePunctualAvailability;
  }) {
    return this.prisma.meetingBase.update({
      where: { id },
      data: {
        date: data.date,
        startTime: data.startTime,
        endTime: data.endTime,
      },
    });
  }

  async updateRecurring({
    id,
    data,
  }: {
    id: string;
    data: UpdateRecurringAvailability;
  }) {
    return this.prisma.meetingReccuring.update({
      where: { id },
      data: {
        startTime: data.startTime,
        endTime: data.endTime,
        dateEnd: data.dateEnd,
        dateStart: data.dateStart,
        dayOfWeek: data.dayOfWeek,
        frequency: data.frequency,
      },
    });
  }

  async delete(id: Availability["id"]) {
    return this.prisma.availability.delete({ where: { id } });
  }

  async getVetSlots({
    veterinarianId,
    clinicId,
    date,
  }: {
    veterinarianId: string;
    clinicId: string;
    date: string;
  }) {
    const targetDate = new Date(date);
    const dayOfWeek = targetDate.getUTCDay();

    // Récupère les disponibilités du veto pour cette date
    const availabilities = await this.prisma.availability.findMany({
      where: {
        veterinarianClinics: {
          veterinarianId,
          clinicId,
        },
        OR: [
          // Dispo ponctuelle ce jour précis
          {
            meetingId: { not: null },
            meeting: { date: targetDate },
          },
          // Dispo récurrente couvrant ce jour
          {
            recurringId: { not: null },
            recurring: {
              dayOfWeek: { has: dayOfWeek },
              dateStart: { lte: targetDate },
              dateEnd: { gte: targetDate },
            },
          },
        ],
      },
      include: {
        meeting: true,
        recurring: true,
      },
    });

    // Récupère les RDV déjà pris ce jour pour ce veto
    const existingMeetings = await this.prisma.animalMeeting.findMany({
      where: {
        veterinarianClinics: { veterinarianId, clinicId },
        meeting: { date: targetDate },
      },
      include: { meeting: true },
    });

    return { availabilities, existingMeetings };
  }

  async getAvailabilities({
    userId,
    start,
    end,
    clinicIds,
  }: {
    userId: string;
    start: Date;
    end: Date;
    clinicIds?: string[];
  }) {
    return this.prisma.availability.findMany({
      where: {
        userId,
        ...(clinicIds &&
          clinicIds.length > 0 && { clinicId: { in: clinicIds } }),
        OR: [
          {
            recurringId: { not: null },
            recurring: recurringFilter(start, end),
          },
          { meetingId: { not: null }, meeting: baseFilter(start, end) },
        ],
      },
      include: {
        recurring: {
          where: recurringFilter(start, end),
          include: recurringWithChildrenInclude(start, end),
        },
        meeting: {
          where: { ...baseFilter(start, end), parentId: null },
          include: { availabilty: { include: { clinic: true } } },
        },
      },
    });
  }
}
