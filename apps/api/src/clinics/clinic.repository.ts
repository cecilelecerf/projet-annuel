import { prisma } from "@api/lib/prisma";
import type {
  UpdateClinic,
  BookingSearchQuery,
  ClinicId,
  PetId,
  SpecialityId,
} from "@armali/schemas";
import { UserRole } from "../../prisma/generated/prisma/enums";
import {
  Clinic,
  Prisma,
  PrismaClient,
} from "../../prisma/generated/prisma/client";

const futureAvailabilityWhere = () => ({
  OR: [
    {
      recurringId: { not: null },
      recurring: { dateEnd: { gte: new Date() } },
    },
    {
      meetingId: { not: null },
      meeting: { date: { gte: new Date() } },
    },
  ],
});

export class ClinicRepository {
  constructor(private prisma: PrismaClient) {}

  async findAll() {
    return this.prisma.clinic.findMany({ orderBy: { createdAt: "desc" } });
  }

  async findById(clinicId: string) {
    return this.prisma.clinic.findUnique({ where: { id: clinicId } });
  }

  async findClientsById(clinicId: string) {
    return this.prisma.clientProfile.findMany({
      where: {
        animal: {
          some: {
            attendingVeterinarianClinic: { clinicId },
          },
        },
      },
      include: { user: { include: { avatar: true } } },
    });
  }
  // ── Trouve la clinique d'un utilisateur selon son rôle ────────────────────
  async findClinicByUserId(userId: string): Promise<(Clinic | null)[]> {
    const director = await this.prisma.directorClinicProfile.findUnique({
      where: { id: userId },
      include: { clinic: true },
    });
    if (director) return [director.clinic];

    const referent = await this.prisma.referentClinicProfile.findUnique({
      where: { id: userId },
      include: { clinic: true },
    });

    if (referent) return [referent.clinic];

    const vetClinic = await this.prisma.veterinarianClinic.findMany({
      where: { veterinarianId: userId },
      include: { clinic: true },
    });

    if (vetClinic.length > 0) return vetClinic.map(({ clinic }) => clinic);
    const secretary = await this.prisma.secretaryProfile.findUnique({
      where: { id: userId },
      include: { clinic: true },
    });
    if (secretary) return [secretary.clinic];
    return [];
  }

  // ── Trouve le clinicId d'un utilisateur selon son rôle ───────────────────
  async findClinicIdByUser({
    userId,
    role,
  }: {
    userId: string;
    role: UserRole;
  }): Promise<ClinicId[] | null> {
    switch (role) {
      case "VETERINARIAN": {
        const vcs = await this.prisma.veterinarianClinic.findMany({
          where: { veterinarianId: userId },
        });
        return vcs.map((vc) => vc.clinicId as ClinicId) ?? null;
      }
      case "SECRETARY": {
        const sp = await this.prisma.secretaryProfile.findUnique({
          where: { id: userId },
        });
        return sp?.clinicId ? [sp.clinicId as ClinicId] : null;
      }
      case "DIRECTOR": {
        const dp = await this.prisma.directorClinicProfile.findUnique({
          where: { id: userId },
          include: { clinic: true },
        });
        return dp?.clinic?.id ? [dp.clinic.id as ClinicId] : null;
      }
      case "REFERENT": {
        const rp = await this.prisma.referentClinicProfile.findUnique({
          where: { id: userId },
        });
        return rp?.clinicId ? [rp.clinicId as ClinicId] : null;
      }
      default:
        return null;
    }
  }

  // ── Director profile ──────────────────────────────────────────────────────
  async findDirectorProfile(userId: string) {
    return prisma.directorClinicProfile.findUnique({ where: { id: userId } });
  }

  // ── Update clinic ─────────────────────────────────────────────────────────
  async update(clinicId: string, data: UpdateClinic) {
    return prisma.clinic.update({
      where: { id: clinicId },
      data: {
        ...data,
        openingHours:
          data.openingHours === null
            ? Prisma.JsonNull
            : (data.openingHours as Prisma.InputJsonValue | undefined),
      },
    });
  }

  // ── Recherche de cliniques pour le booking ────────────────────────────────
  async searchClinics({
    startDate,
    endDate,
    specialityId,
    petId,
  }: Omit<BookingSearchQuery, "date"> & { startDate: Date; endDate: Date }) {
    return prisma.clinic.findMany({
      where: {
        ...(petId && {
          pets: { some: { id: petId } },
        }),
        veterinarianClinics: {
          some: {
            veterinarian: {
              ...(petId && {
                pets: { some: { id: petId } },
              }),
              ...(specialityId && {
                specialities: { some: { id: specialityId } },
              }),
              user: {
                availabilities: {
                  some: {
                    OR: [
                      {
                        recurringId: { not: null },
                        recurring: {
                          dateStart: { lte: startDate },
                          dateEnd: { gte: endDate },
                        },
                      },
                      {
                        meetingId: { not: null },
                        meeting: {
                          date: { gte: startDate, lte: endDate },
                        },
                      },
                    ],
                  },
                },
              },
            },
          },
        },
      },
      include: {
        veterinarianClinics: {
          include: {
            veterinarian: {
              include: {
                specialities: true,
                user: {
                  include: {
                    availabilities: {
                      where: futureAvailabilityWhere(),
                      include: { meeting: true, recurring: true },
                      take: 1,
                      orderBy: { meeting: { date: "asc" } },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  // ── Suppression de clinique ───────────────────────────────────────────────

  findClinicById(clinicId: string) {
    return this.prisma.clinic.findUnique({ where: { id: clinicId } });
  }

  async countClinicDependencies(clinicId: string) {
    const [orderCount, meetingCount, appointmentCount, medicalHistoryCount] =
      await Promise.all([
        this.prisma.order.count({ where: { clinicId } }),
        this.prisma.internalMeeting.count({ where: { clinicId } }),
        this.prisma.animalMeeting.count({
          where: { veterinarianClinic: { clinicId } },
        }),
        this.prisma.animalMedicalHistory.count({
          where: { clinicAct: { clinicId } },
        }),
      ]);

    return { orderCount, meetingCount, appointmentCount, medicalHistoryCount };
  }

  deleteClinicById(clinicId: string) {
    return this.prisma.clinic.delete({ where: { id: clinicId } });
  }

  async getAcceptedPets(clinicId: ClinicId) {
    const clinic = await this.prisma.clinic.findUnique({
      where: { id: clinicId },
      include: { pets: { orderBy: { name: "asc" } } },
    });
    return clinic?.pets ?? null;
  }

  async setAcceptedPets(clinicId: ClinicId, petIds: PetId[]) {
    const clinic = await this.prisma.clinic.update({
      where: { id: clinicId },
      data: {
        pets: {
          set: petIds.map((id) => ({ id })),
        },
      },
      include: { pets: { orderBy: { name: "asc" } } },
    });
    return clinic.pets;
  }

  async getAcceptedSpecialities(clinicId: ClinicId) {
    const clinic = await this.prisma.clinic.findUnique({
      where: { id: clinicId },
      include: { specialities: { orderBy: { name: "asc" } } },
    });
    return clinic?.specialities ?? null;
  }

  async setAcceptedSpecialities(
    clinicId: ClinicId,
    specialityIds: SpecialityId[],
  ) {
    const clinic = await this.prisma.clinic.update({
      where: { id: clinicId },
      data: {
        specialities: {
          set: specialityIds.map((id) => ({ id })),
        },
      },
      include: { specialities: { orderBy: { name: "asc" } } },
    });
    return clinic.specialities;
  }
}
