import { MeetingKind } from "../../prisma/generated/prisma/enums";
import { Prisma } from "../../prisma/generated/prisma/client";
import { PrismaClient } from "@prisma/client/extension";

const recurringFilter = (start: Date, end: Date) => ({
  dateStart: { lte: end },
  dateEnd: { gte: start },
});

const baseFilter = (start: Date, end: Date) => ({
  date: { gte: start, lte: end },
});

// ── Include réutilisé pour "récurrence + occurrences enfants" ──────────────
const recurringWithChildrenInclude = (start: Date, end: Date) =>
  ({
    internalMeeting: { include: { participants: true } },
    availabilty: true,
    childrens: {
      where: baseFilter(start, end),
      include: {
        internalMeeting: { include: { participants: true } },
        availabilty: true,
      },
    },
  }) satisfies Prisma.MeetingReccuringInclude;

export type RecurringWithChildren = Prisma.MeetingReccuringGetPayload<{
  include: ReturnType<typeof recurringWithChildrenInclude>;
}>;

// ═══════════════════════════════════════════════════════════════
// Includes par méthode — définis en fonction de (start, end) car
// le `where` imbriqué en dépend (n'affecte pas la forme du type)
// ═══════════════════════════════════════════════════════════════

const internalMeetingsInclude = (start: Date, end: Date) =>
  ({
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
  }) satisfies Prisma.InternalMeetingParticipantInclude;

export type InternalMeetingForUser =
  Prisma.InternalMeetingParticipantGetPayload<{
    include: ReturnType<typeof internalMeetingsInclude>;
  }>;

const animalMeetingsAsVetInclude = (start: Date, end: Date) =>
  ({
    meeting: {
      where: { ...baseFilter(start, end), parentId: null },
      include: {
        animalMeeting: { include: { speciality: true } },
      },
    },
  }) satisfies Prisma.AnimalMeetingInclude;

export type AnimalMeetingAsVet = Prisma.AnimalMeetingGetPayload<{
  include: ReturnType<typeof animalMeetingsAsVetInclude>;
}>;

const animalMeetingsAsClientInclude = (start: Date, end: Date) =>
  ({
    meeting: {
      where: { ...baseFilter(start, end), parentId: null },
      include: { animalMeeting: true },
    },
    animal: true,
  }) satisfies Prisma.AnimalMeetingInclude;

export type AnimalMeetingAsClient = Prisma.AnimalMeetingGetPayload<{
  include: ReturnType<typeof animalMeetingsAsClientInclude>;
}>;

const availabilitiesInclude = (start: Date, end: Date) =>
  ({
    recurring: {
      where: recurringFilter(start, end),
      include: recurringWithChildrenInclude(start, end),
    },
    meeting: {
      where: { ...baseFilter(start, end), parentId: null },
      include: { availabilty: true },
    },
  }) satisfies Prisma.AvailabilityInclude;

export type AvailabilityWithSchedule = Prisma.AvailabilityGetPayload<{
  include: ReturnType<typeof availabilitiesInclude>;
}>;

const availabilitiesByClinicInclude = (start: Date, end: Date) =>
  ({
    recurring: {
      where: recurringFilter(start, end),
      include: recurringWithChildrenInclude(start, end),
    },
    meeting: {
      where: baseFilter(start, end),
      include: { availabilty: true },
    },
  }) satisfies Prisma.AvailabilityInclude;

export type AvailabilityByClinic = Prisma.AvailabilityGetPayload<{
  include: ReturnType<typeof availabilitiesByClinicInclude>;
}>;

const meetingByIdInclude = {
  animalMeeting: true,
  internalMeeting: { include: { participants: true } },
  availabilty: true,
  parent: true,
} satisfies Prisma.MeetingBaseInclude;

export type MeetingWithDetails = Prisma.MeetingBaseGetPayload<{
  include: typeof meetingByIdInclude;
}>;

const recurringByIdInclude = {
  internalMeeting: { include: { participants: true } },
  availabilty: true,
} satisfies Prisma.MeetingReccuringInclude;

export type RecurringWithDetails = Prisma.MeetingReccuringGetPayload<{
  include: typeof recurringByIdInclude;
}>;

// ═══════════════════════════════════════════════════════════════
// Repository
// ═══════════════════════════════════════════════════════════════

export class MeetingRepository {
  constructor(private prisma: PrismaClient) {}

  async getInternalMeetings(
    userId: string,
    start: Date,
    end: Date,
  ): Promise<InternalMeetingForUser[]> {
    return this.prisma.internalMeetingParticipant.findMany({
      where: { userId },
      include: internalMeetingsInclude(start, end),
    });
  }

  async getAnimalMeetingsAsVet(
    vetProfileId: string,
    start: Date,
    end: Date,
  ): Promise<AnimalMeetingAsVet[]> {
    return this.prisma.animalMeeting.findMany({
      where: { veterinarianClinic: { veterinarian: { id: vetProfileId } } },
      include: animalMeetingsAsVetInclude(start, end),
    });
  }

  async getAnimalMeetingsAsClient(
    clientProfileId: string,
    start: Date,
    end: Date,
  ): Promise<AnimalMeetingAsClient[]> {
    return this.prisma.animalMeeting.findMany({
      where: { animal: { clientId: clientProfileId } },
      include: animalMeetingsAsClientInclude(start, end),
    });
  }

  async getAvailabilities({
    userId,
    start,
    end,
  }: {
    userId: string;
    start: Date;
    end: Date;
  }): Promise<AvailabilityWithSchedule[]> {
    return this.prisma.availability.findMany({
      where: {
        userId,
        OR: [
          {
            recurringId: { not: null },
            recurring: recurringFilter(start, end),
          },
          { meetingId: { not: null }, meeting: baseFilter(start, end) },
        ],
      },
      include: availabilitiesInclude(start, end),
    });
  }

  async getAvailabilitiesByClinic({
    clinicId,
    start,
    end,
  }: {
    clinicId: string;
    start: Date;
    end: Date;
  }): Promise<AvailabilityByClinic[]> {
    return this.prisma.availability.findMany({
      where: {
        AND: [
          {
            OR: [
              {
                user: {
                  OR: [
                    { directorClinicProfile: { clinicId } },
                    { referentClinicProfile: { clinicId } },
                    { secretaryProfile: { clinicId } },
                  ],
                },
              },
              { clinicId },
            ],
          },
          {
            OR: [
              { recurring: recurringFilter(start, end) },
              { meeting: baseFilter(start, end) },
            ],
          },
        ],
      },
      include: availabilitiesByClinicInclude(start, end),
    });
  }

  async getMeetingById(id: string): Promise<MeetingWithDetails | null> {
    return this.prisma.meetingBase.findUnique({
      where: { id },
      include: meetingByIdInclude,
    });
  }

  async getRecurringById(id: string): Promise<RecurringWithDetails | null> {
    return this.prisma.meetingReccuring.findUnique({
      where: { id },
      include: recurringByIdInclude,
    });
  }

  async createException({
    parentId,
    date,
    kind,
    startTime,
    endTime,
  }: {
    parentId: string;
    date: Date;
    kind: MeetingKind;
    startTime: Date;
    endTime: Date;
  }): Promise<Prisma.MeetingBaseGetPayload<object>> {
    return this.prisma.meetingBase.create({
      data: {
        type: "EXCEPTION",
        date,
        startTime,
        endTime,
        kind,
        parentId,
      },
    });
  }
}
