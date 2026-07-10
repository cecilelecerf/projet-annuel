import { PrismaClient } from "../../prisma/generated/prisma/client";
import { conversationMemberUserSelect } from "./messaging.types";

export class ContactsRepository {
  constructor(private prisma: PrismaClient) {}

  // ── Résolution des cliniques d'un vétérinaire (peut en avoir plusieurs) ────
  async findClinicIdsForVeterinarian(userId: string): Promise<string[]> {
    const profile = await this.prisma.veterinarianProfile.findUnique({
      where: { id: userId },
      include: { veterinarianClinics: { select: { clinicId: true } } },
    });
    return profile?.veterinarianClinics.map((vc) => vc.clinicId) ?? [];
  }

  // TODO : delete this, is in clinic repository and service
  async listClinicColleagues(clinicIds: string[], excludeUserId: string) {
    if (clinicIds.length === 0) return [];

    const users = await this.prisma.user.findMany({
      where: {
        id: { not: excludeUserId },
        OR: [
          { secretaryProfile: { clinicId: { in: clinicIds } } },
          {
            directorClinicProfile: { clinic: { id: { in: clinicIds } } },
          },
          { referentClinicProfile: { clinicId: { in: clinicIds } } },
          {
            veterinarianProfile: {
              veterinarianClinics: { some: { clinicId: { in: clinicIds } } },
            },
          },
        ],
      },
      select: {
        ...conversationMemberUserSelect,
        secretaryProfile: {
          select: { clinic: { select: { id: true, name: true } } },
        },
        directorClinicProfile: {
          select: { clinic: { select: { id: true, name: true } } },
        },
        referentClinicProfile: {
          select: { clinic: { select: { id: true, name: true } } },
        },
        veterinarianProfile: {
          select: {
            veterinarianClinics: {
              where: { clinicId: { in: clinicIds } },
              select: { clinic: { select: { id: true, name: true } } },
            },
          },
        },
      },
      orderBy: [{ lastname: "asc" }, { firstname: "asc" }],
    });

    return users.map((user) => {
      let clinics: { id: string; name: string }[] = [];
      switch (user.role) {
        case "SECRETARY":
          clinics = user.secretaryProfile
            ? [user.secretaryProfile.clinic]
            : [];
          break;
        case "DIRECTOR":
          clinics = user.directorClinicProfile?.clinic
            ? [user.directorClinicProfile.clinic]
            : [];
          break;
        case "REFERENT":
          clinics = user.referentClinicProfile
            ? [user.referentClinicProfile.clinic]
            : [];
          break;
        case "VETERINARIAN":
          clinics =
            user.veterinarianProfile?.veterinarianClinics.map(
              (vc) => vc.clinic,
            ) ?? [];
          break;
      }
      const {
        secretaryProfile: _sp,
        directorClinicProfile: _dcp,
        referentClinicProfile: _rcp,
        veterinarianProfile: _vp,
        ...rest
      } = user;
      return { ...rest, clinics };
    });
  }
  // TODO : delete this, is in user repository and service
  async listDirectors(excludeUserId: string) {
    const directors = await this.prisma.user.findMany({
      where: { role: "DIRECTOR", id: { not: excludeUserId } },
      select: {
        ...conversationMemberUserSelect,
        directorClinicProfile: {
          select: { clinic: { select: { id: true, name: true } } },
        },
      },
      orderBy: [{ lastname: "asc" }, { firstname: "asc" }],
    });

    return directors.map((director) => {
      const { directorClinicProfile, ...rest } = director;
      return {
        ...rest,
        clinics: directorClinicProfile?.clinic ? [directorClinicProfile.clinic] : [],
      };
    });
  }
  // TODO : delete this, is in clinics repository and service

  async findUsersWithClinicIds(userIds: string[]) {
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      include: {
        secretaryProfile: { select: { clinicId: true } },
        directorClinicProfile: { select: { clinic: { select: { id: true } } } },
        referentClinicProfile: { select: { clinicId: true } },
        veterinarianProfile: {
          include: { veterinarianClinics: { select: { clinicId: true } } },
        },
      },
    });

    return users.map((user) => {
      let clinicIds: string[] = [];
      switch (user.role) {
        case "SECRETARY":
          clinicIds = user.secretaryProfile
            ? [user.secretaryProfile.clinicId]
            : [];
          break;
        case "DIRECTOR":
          clinicIds = user.directorClinicProfile?.clinic
            ? [user.directorClinicProfile.clinic?.id]
            : [];
          break;
        case "REFERENT":
          clinicIds = user.referentClinicProfile
            ? [user.referentClinicProfile.clinicId]
            : [];
          break;
        case "VETERINARIAN":
          clinicIds =
            user.veterinarianProfile?.veterinarianClinics.map(
              (c) => c.clinicId,
            ) ?? [];
          break;
      }
      return { id: user.id, role: user.role, clinicIds };
    });
  }
}