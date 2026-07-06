import { prisma } from "@api/lib/prisma";
import type {
  UpdateClinic,
  BookingSearchQuery,
  ClinicId,
} from "@armali/schemas";
import { UserRole } from "../../prisma/generated/prisma/enums";
import { PrismaClient } from "../../prisma/generated/prisma/client";

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

  async findById(clinicId: string) {
    return this.prisma.clinic.findUnique({ where: { id: clinicId } });
  }

  async findClientsById(clinicId: string) {
    return this.prisma.clinic.findUnique({
      where: { id: clinicId },
      include: {
        veterinarianClinics: {
          include: {
            veterinarian: {
              include: {
                animals: { include: { client: { include: { user: true } } } },
              },
            },
          },
        },
      },
    });
  }

  // ── Trouve la clinique d'un utilisateur selon son rôle ────────────────────
  async findClinicByUserId(userId: string) {
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
        });
        return dp?.clinicId ? [dp.clinicId as ClinicId] : null;
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

  // ── Staff d'une clinique ──────────────────────────────────────────────────
  async findStaff(clinicId: string) {
    const [director, referents, vets, secretaries] = await Promise.all([
      prisma.directorClinicProfile.findFirst({
        where: { clinicId },
        include: { user: true },
      }),
      prisma.referentClinicProfile.findMany({
        where: { clinicId },
        include: { user: true },
      }),
      prisma.veterinarianClinic.findMany({
        where: { clinicId },
        include: {
          veterinarian: {
            include: { user: true },
          },
        },
      }),
      prisma.secretaryProfile.findMany({
        where: { clinicId },
        include: { user: true },
      }),
    ]);

    return {
      director: director
        ? { ...director.user, role: "DIRECTOR" as const }
        : null,
      referents: referents.map((r) => ({
        ...r.user,
        role: "REFERENT" as const,
      })),
      veterinarians: vets.map((v) => ({
        ...v.veterinarian.user,
        role: "VETERINARIAN" as const,
        licenseNumber: v.veterinarian.licenseNumber,
      })),
      secretaries: secretaries.map((s) => ({
        ...s.user,
        role: "SECRETARY" as const,
      })),
    };
  }

  // ── Director profile ──────────────────────────────────────────────────────
  async findDirectorProfile(userId: string) {
    return prisma.directorClinicProfile.findUnique({ where: { id: userId } });
  }

  // ── Update clinic ─────────────────────────────────────────────────────────
  async update(clinicId: string, data: UpdateClinic) {
    return prisma.clinic.update({ where: { id: clinicId }, data });
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
          clinicPet: { some: { id: petId } },
        }),
        veterinarianClinics: {
          some: {
            veterinarian: {
              ...(petId && {
                pet: { some: { id: petId } },
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
}
