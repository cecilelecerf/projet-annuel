import { prisma } from "@api/lib/prisma";

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

export class MettingRepository {
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
            veterinarianClinicAvailability: {
              where: { base: periodFilter(start, end) },
              include: { base: baseWithExceptions },
            },
          },
        },
        user: {
          include: {
            internalMettingParticipants: {
              where: { metting: { base: periodFilter(start, end) } },
              include: {
                metting: { include: { base: baseWithExceptions } },
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
            internalMettingParticipants: {
              where: { metting: { base: periodFilter(start, end) } },
              include: {
                metting: { include: { base: baseWithExceptions } },
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
            internalMettingParticipants: {
              where: { metting: { base: periodFilter(start, end) } },
              include: {
                metting: { include: { base: baseWithExceptions } },
              },
            },
          },
        },
      },
    });
  }
}
