import { User } from "../../prisma/generated/prisma/client";
import { UserRole } from "../../prisma/generated/prisma/enums";
import { userWithProfileAndClinicIdInclude } from "./user.types";
import { PrismaClient } from "@prisma/client/extension";

export class UserRepository {
  constructor(private prisma: PrismaClient) {}

  async getClinicIdByUserId({
    id,
    role,
  }: {
    id: string;
    role: UserRole;
  }): Promise<string[] | null> {
    switch (role) {
      case "VETERINARIAN": {
        const profile = await this.prisma.veterinarianClinic.findMany({
          where: { veterinarianId: id },
        });
        return profile?.clinicId ?? null;
      }
      case "SECRETARY": {
        const profile = await this.prisma.secretaryProfile.findUnique({
          where: { id },
        });
        return profile?.clinicId ? [profile?.clinicId] : null;
      }
      case "DIRECTOR": {
        const profile = await this.prisma.directorClinicProfile.findUnique({
          where: { id },
        });
        return profile?.clinicId ? [profile?.clinicId] : null;
      }
      case "REFERANT": {
        const profile = await this.prisma.referentClinicProfile.findUnique({
          where: { id },
        });
        return profile?.clinicId ? [profile?.clinicId] : null;
      }
      default:
        return null;
    }
  }

  async getUsersByClinic({
    clinicIds,
  }: {
    clinicIds: string[];
  }): Promise<Omit<User, "password">[]> {
    return this.prisma.user.findMany({
      where: {
        OR: [
          { secretaryProfile: { clinicId: { in: clinicIds } } },
          { directorClinicProfile: { clinicId: { in: clinicIds } } },
          { referentClinicProfile: { clinicId: { in: clinicIds } } },
          {
            veterinarianProfile: {
              veterinarianClinic: { clinicId: { in: clinicIds } },
            },
          },
        ],
      },
      omit: { password: true },
    });
  }

  async getUsersByRoleAndClinic({
    clinicIds,
    roles,
  }: {
    clinicIds: string[];
    roles: UserRole[];
  }) {
    return this.prisma.user.findMany({
      where: {
        role: { in: roles },
        OR: [
          { secretaryProfile: { clinicId: { in: clinicIds } } },
          { directorClinicProfile: { clinicId: { in: clinicIds } } },
          { referentClinicProfile: { clinicId: { in: clinicIds } } },
          {
            veterinarianProfile: {
              veterinarianClinic: { some: { clinicId: { in: clinicIds } } },
            },
          },
        ],
      },
      omit: { password: true },

      include: userWithProfileAndClinicIdInclude,
    });
  }

  async getUserById({ id }: { id: string }) {
    return this.prisma.user.findUnique({
      where: { id },
      omit: { password: true },
      include: {
        secretaryProfile: true,
        directorClinicProfile: true,
        referentClinicProfile: true,
        veterinarianProfile: true,
        clientProfile: true,
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
      },

      omit: { password: true },
    });
  }
  async getAllUsersByRole({ roles }: { roles: UserRole[] }) {
    return this.prisma.user.findMany({
      where: { role: { in: roles } },
      omit: { password: true },
      include: userWithProfileAndClinicIdInclude,
    });
  }
}
