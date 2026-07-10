import { PrismaClient, User } from "../../prisma/generated/prisma/client";
import { UserRole } from "../../prisma/generated/prisma/enums";
import { userWithProfileAndClinicIdInclude } from "./user.types";
import { conversationMemberUserSelect } from "@api/messaging/messaging.types";

export class UserRepository {
  constructor(private prisma: PrismaClient) {}

  async getUsersByClinic({
    clinicIds,
  }: {
    clinicIds: string[];
  }): Promise<Omit<User, "password">[]> {
    return this.prisma.user.findMany({
      where: {
        OR: [
          { secretaryProfile: { clinicId: { in: clinicIds } } },
          { directorClinicProfile: { clinic: { id: { in: clinicIds } } } },
          { referentClinicProfile: { clinicId: { in: clinicIds } } },
          {
            veterinarianProfile: {
              veterinarianClinics: { some: { clinicId: { in: clinicIds } } },
            },
          },
        ],
      },
      include: { avatar: true },
      omit: { password: true },
    });
  }

  async getUserById({ id }: { id: string }) {
    return this.prisma.user.findFirst({
      where: { id },
      omit: { password: true },
      include: {
        secretaryProfile: true,
        directorClinicProfile: true,
        referentClinicProfile: true,
        veterinarianProfile: true,
        clientProfile: true,
        avatar: true,
      },
    });
  }

  async getAllUsers() {
    return this.prisma.user.findMany({
      include: {
        veterinarianProfile: true,
        clientProfile: true,
        secretaryProfile: true,
        directorClinicProfile: true,
        referentClinicProfile: true,
        avatar: true,
      },

      omit: { password: true },
    });
  }
  async getAllUsersByRole({ roles }: { roles?: UserRole[] }) {
    return this.prisma.user.findMany({
      where: { role: { in: roles } },
      omit: { password: true },
      include: userWithProfileAndClinicIdInclude,
    });
  }
  async updateAvatar({
    userId,
    avatarId,
  }: {
    userId: string;
    avatarId: string;
  }) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { avatarId },
      include: { avatar: true },
      omit: { password: true },
    });
  }

  // ── Messagerie : collègues éligibles à une conversation ────────────────

  async findClinicColleagues(clinicIds: string[], excludeUserId: string) {
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

  async findDirectors(excludeUserId: string) {
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
        clinics: directorClinicProfile?.clinic
          ? [directorClinicProfile.clinic]
          : [],
      };
    });
  }

  async findWithClinicIds(userIds: string[]) {
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