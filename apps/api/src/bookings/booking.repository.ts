import type { BookingSearchQuery } from "@armali/schemas";
import { PrismaClient } from "../../prisma/generated/prisma/client";

export class BookingRepository {
  constructor(private prisma: PrismaClient) {}

  // ── Recherche de cliniques avec vetos et dispos ───────────────────────────
  async searchClinics({
    lat,
    lng,
    radiusKm = 20,
    date,
    specialityId,
    petId,
  }: BookingSearchQuery) {
    // Récupère les cliniques qui ont au moins un veto disponible
    // pour l'espèce de l'animal et la spécialité demandée
    const clinics = await this.prisma.clinic.findMany({
      where: {
        veterinarianClinics: {
          some: {
            // Le veto prend en charge cette espèce
            ...(petId && {
              veterinarian: {
                veterinarianPets: { some: { petId } },
              },
            }),
            // Le veto a la spécialité demandée
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
                      // Dispo récurrente encore active
                      {
                        recurringId: { not: null },
                        recurring: {
                          dateEnd: { gte: date ? new Date(date) : new Date() },
                        },
                      },
                      // Dispo ponctuelle future
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
            // Le veto a des disponibilités
          },
        },
      },
      include: {
        veterinarianClinics: {
          include: {
            veterinarian: {
              include: {
                specialities: true,
              },
            },
            availabilities: {
              where: {
                OR: [
                  {
                    recurringId: { not: null },
                    recurring: {
                      dateEnd: { gte: new Date() },
                    },
                  },
                  {
                    meetingId: { not: null },
                    meeting: { date: { gte: new Date() } },
                  },
                ],
              },
              include: {
                meeting: true,
                recurring: true,
              },
              take: 1,
              orderBy: { meeting: { date: "asc" } },
            },
          },
        },
      },
    });

    return clinics;
  }

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
