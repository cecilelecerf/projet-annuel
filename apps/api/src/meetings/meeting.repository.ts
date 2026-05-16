import { prisma } from "@api/lib/prisma";
import { Clinic, User } from "apps/api/prisma/generated/prisma/client";

const periodFilter = (start: Date, end: Date) => ({
  OR: [
    { type: "SPECIFIED" as const, specificDate: { gte: start, lte: end } },
    {
      type: "RECURRING" as const,
      dateStart: { lte: end },
      dateEnd: { gte: start },
    },
  ],
});

const baseWithExceptions = {
  include: { exceptions: true },
};

export class MeetingRepository {
  async getVeterinarianMeetings(id: string, start: Date, end: Date) {
    return prisma.veterinarianProfile.findUnique({
      where: { id },
      include: {
        animalMeeting: {
          where: { base: periodFilter(start, end) },
          include: { base: baseWithExceptions },
        },
        veterinarianClinic: {
          include: {
            availabilities: {
              where: { base: periodFilter(start, end) },
              include: { base: baseWithExceptions },
            },
          },
        },
        user: {
          include: {
            internalMeetingParticipants: {
              where: { meeting: { base: periodFilter(start, end) } },
              include: {
                meeting: { include: { base: baseWithExceptions } },
              },
            },
          },
        },
      },
    });
  }

  async getSecretaryMeetings(id: string, start: Date, end: Date) {
    return prisma.secretaryProfile.findUnique({
      where: { id },
      include: {
        user: {
          include: {
            internalMeetingParticipants: {
              where: { meeting: { base: periodFilter(start, end) } },
              include: {
                meeting: { include: { base: baseWithExceptions } },
              },
            },
          },
        },
      },
    });
  }

  async getReferantMeetings(id: string, start: Date, end: Date) {
    return prisma.referentClinicProfile.findUnique({
      where: { id },
      include: {
        user: {
          include: {
            internalMeetingParticipants: {
              where: { meeting: { base: periodFilter(start, end) } },
              include: {
                meeting: { include: { base: baseWithExceptions } },
              },
            },
          },
        },
      },
    });
  }

  async getAllAvailabilities({
    id,
    start,
    end,
  }: {
    id: string;
    start: Date;
    end: Date;
  }) {
    return prisma.user.findUnique({
      where: { id },
      include: {
        availabilities: {
          where: { base: periodFilter(start, end) },
          include: {
            base: baseWithExceptions,
          },
        },
        veterinarianProfile: {
          include: {
            veterinarianClinic: {
              include: {
                availabilities: {
                  where: { base: periodFilter(start, end) },
                  include: {
                    base: baseWithExceptions,
                  },
                },
              },
            },
          },
        },
      },
    });
  }
  async getAllAvailabilitiesByClinic({
    id,
    clinicId,
    start,
    end,
  }: {
    id: User["id"];
    clinicId: Clinic["id"];
    start: Date;
    end: Date;
  }) {
    return prisma.user.findUnique({
      where: { id },
      include: {
        availabilities: {
          where: { base: periodFilter(start, end) },
          include: {
            base: baseWithExceptions,
          },
        },
        veterinarianProfile: {
          include: {
            veterinarianClinic: {
              where: { clinicId },
              include: {
                availabilities: {
                  where: { base: periodFilter(start, end) },
                  include: {
                    base: baseWithExceptions,
                  },
                },
              },
            },
          },
        },
      },
    });
  }
}
