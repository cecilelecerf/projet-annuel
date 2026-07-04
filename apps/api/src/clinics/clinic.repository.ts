import { prisma } from "@api/lib/prisma";
import type { UpdateClinic, BookingSearchQuery } from "@armali/schemas";
import { UserRole } from "../../prisma/generated/prisma/enums";
import { PrismaClient } from "../../prisma/generated/prisma/client";

const USER_SELECT = {
  id: true,
  firstname: true,
  lastname: true,
  email: true,
} as const;

const FUTURE_AVAILABILITY_WHERE = () => ({
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

  // ── Trouve la clinique d'un utilisateur selon son rôle ────────────────────
  async findClinicByUserId(userId: string) {
    const director = await this.prisma.directorClinicProfile.findUnique({
      where: { id: userId },
      include: { clinic: true },
    });
    if (director) return director.clinic;

    const referent = await this.prisma.referentClinicProfile.findUnique({
      where: { id: userId },
      include: { clinic: true },
    });
    if (referent) return referent.clinic;

    const vetClinic = await this.prisma.veterinarianClinic.findFirst({
      where: { veterinarianId: userId },
      include: { clinic: true },
    });
    if (vetClinic) return vetClinic.clinic;

    const secretary = await this.prisma.secretaryProfile.findUnique({
      where: { id: userId },
      include: { clinic: true },
    });
    return secretary?.clinic ?? null;
  }

  // ── Trouve le clinicId d'un utilisateur selon son rôle ───────────────────
  async findClinicIdByUser(userId: string, role: UserRole) {
    switch (role) {
      case "VETERINARIAN": {
        const vc = await this.prisma.veterinarianClinic.findFirst({
          where: { veterinarianId: userId },
        });
        return vc?.clinicId ?? null;
      }
      case "SECRETARY": {
        const sp = await this.prisma.secretaryProfile.findUnique({
          where: { id: userId },
        });
        return sp?.clinicId ?? null;
      }
      case "DIRECTOR": {
        const dp = await this.prisma.directorClinicProfile.findUnique({
          where: { id: userId },
        });
        return dp?.clinicId ?? null;
      }
      case "REFERANT": {
        const rp = await this.prisma.referentClinicProfile.findUnique({
          where: { id: userId },
        });
        return rp?.clinicId ?? null;
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
        include: { user: { select: USER_SELECT } },
      }),
      prisma.referentClinicProfile.findMany({
        where: { clinicId },
        include: { user: { select: USER_SELECT } },
      }),
      prisma.veterinarianClinic.findMany({
        where: { clinicId },
        include: {
          veterinarian: {
            include: { user: { select: USER_SELECT } },
          },
        },
      }),
      prisma.secretaryProfile.findMany({
        where: { clinicId },
        include: { user: { select: USER_SELECT } },
      }),
    ]);

    return {
      director: director
        ? { ...director.user, role: "DIRECTOR" as const }
        : null,
      referents: referents.map((r) => ({
        ...r.user,
        role: "REFERANT" as const,
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
  async searchClinics({ date, specialityId, petId }: BookingSearchQuery) {
    const futureDate = date ? new Date(date) : new Date();

    return prisma.clinic.findMany({
      where: {
        veterinarianClinics: {
          some: {
            ...(petId && {
              veterinarian: {
                pet: { some: { petId } },
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
                        recurring: { dateEnd: { gte: futureDate } },
                      },
                      {
                        meetingId: { not: null },
                        meeting: { date: { gte: futureDate } },
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
                      where: FUTURE_AVAILABILITY_WHERE(),
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
