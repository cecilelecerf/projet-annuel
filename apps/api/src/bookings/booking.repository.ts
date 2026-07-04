import type { BookingSearchQuery } from "@armali/schemas";
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

  // ── Créneaux disponibles pour un veto sur une date ────────────────────────
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
        veterinarianClinic: {
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
        veterinarianClinic: { veterinarianId, clinicId },
        meeting: { date: targetDate },
      },
      include: { meeting: true },
    });

    return { availabilities, existingMeetings };
  }
}
