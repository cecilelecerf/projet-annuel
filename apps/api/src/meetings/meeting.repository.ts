import { MeetingKind } from "../../prisma/generated/prisma/enums";
import { PrismaClient } from "@prisma/client/extension";

const recurringFilter = (start: Date, end: Date) => ({
  dateStart: { lte: end },
  dateEnd: { gte: start },
});

const baseFilter = (start: Date, end: Date) => ({
  date: { gte: start, lte: end },
});

const recurringWithChildren = (start: Date, end: Date) => ({
  internalMeeting: { include: { participants: true } },
  availabilty: true,
  childrens: {
    where: baseFilter(start, end),
    include: {
      internalMeeting: { include: { participants: true } },
      availabilty: true,
    },
  },
});

export class MeetingRepository {
  constructor(private prisma: PrismaClient) {}

  async getInternalMeetings(userId: string, start: Date, end: Date) {
    return await this.prisma.internalMeetingParticipant.findMany({
      where: { userId },
      include: {
        meeting: {
          include: {
            recurring: {
              where: recurringFilter(start, end),
              include: {
                ...recurringWithChildren(start, end),
                internalMeeting: { include: { participants: true } },
              },
            },
            meeting: {
              where: {
                ...baseFilter(start, end),
                parentId: null,
              },
              include: {
                internalMeeting: { include: { participants: true } },
              },
            },
          },
        },
      },
    });
  }

  async getAnimalMeetingsAsVet(vetProfileId: string, start: Date, end: Date) {
    return this.prisma.animalMeeting.findMany({
      where: { veterinarianClinic: { veterinarian: { id: vetProfileId } } },
      include: {
        meeting: {
          where: {
            ...baseFilter(start, end),
            parentId: null,
          },
          include: {
            animalMeeting: { include: { speciality: true } },
          },
        },
      },
    });
  }
  async getAnimalMeetingsAsClient(
    clientProfileId: string,
    start: Date,
    end: Date,
  ) {
    return this.prisma.animalMeeting.findMany({
      where: { animal: { clientId: clientProfileId } },
      include: {
        meeting: {
          where: {
            ...baseFilter(start, end),
            parentId: null,
          },
          include: { animalMeeting: true },
        },
        animal: true,
      },
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
  }) {
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
      include: {
        recurring: {
          where: recurringFilter(start, end),
          include: recurringWithChildren(start, end),
        },
        meeting: {
          where: {
            ...baseFilter(start, end),
            parentId: null,
          },
          include: { availabilty: true },
        },
      },
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
  }) {
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
      include: {
        recurring: {
          where: recurringFilter(start, end),
          include: recurringWithChildren(start, end),
        },
        meeting: {
          where: baseFilter(start, end),
          include: { availabilty: true },
        },
      },
    });
  }
  async getMeetingById(id: string) {
    return this.prisma.meetingBase.findUnique({
      where: { id },
      include: {
        animalMeeting: true,
        internalMeeting: { include: { participants: true } },
        availabilty: true,
        parent: true,
      },
    });
  }

  async getRecurringById(id: string) {
    return this.prisma.meetingReccuring.findUnique({
      where: { id },
      include: {
        internalMeeting: { include: { participants: true } },
        availabilty: true,
      },
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
  }) {
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
