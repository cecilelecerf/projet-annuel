import { PrismaClient } from "../../prisma/generated/prisma/client";

export class BookingRepository {
  constructor(private prisma: PrismaClient) {}

  // ── Vétérinaires d'une clinique disponibles ───────────────────────────────
  async getClinicVets({
    clinicId,
    date,
    specialityId,
    petId,
  }: {
    clinicId: string;
    date?: string;
    specialityId?: string;
    petId?: string;
  }) {
    return this.prisma.veterinarianClinic.findMany({
      where: {
        clinicId,
        ...(petId && {
          veterinarian: {
            veterinarianPets: { some: { petId } },
          },
        }),
        ...(specialityId && {
          veterinarian: {
            specialities: { some: { id: specialityId } },
          },
        }),
        veterinarian: {
          user: {
            availabilities: {
              some: {
                OR: [
                  {
                    recurringId: { not: null },
                    recurring: {
                      dateEnd: { gte: date ? new Date(date) : new Date() },
                    },
                  },
                  {
                    meetingId: { not: null },
                    meeting: {
                      date: { gte: date ? new Date(date) : new Date() },
                    },
                  },
                ],
              },
            },
          },
        },
      },
      include: {
        veterinarian: {
          include: {
            user: { omit: { password: true } },
            specialities: true,
          },
        },
      },
    });
  }
}
