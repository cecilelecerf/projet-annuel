import { prisma } from "@api/lib/prisma";
import { UserRole } from "apps/api/prisma/generated/prisma/enums";

export class UserRepository {
  async getClinicIdByUserId({
    id,
    role,
  }: {
    id: string;
    role: UserRole;
  }): Promise<string | null> {
    switch (role) {
      case "SECRETARY": {
        const profile = await prisma.secretaryProfile.findUnique({
          where: { id },
        });
        return profile?.clinicId ?? null;
      }
      case "DIRECTOR": {
        const profile = await prisma.directorClinicProfile.findUnique({
          where: { id },
        });
        return profile?.clinicId ?? null;
      }
      case "REFERANT": {
        const profile = await prisma.referentClinicProfile.findUnique({
          where: { id },
        });
        return profile?.clinicId ?? null;
      }
      default:
        return null;
    }
  }

  async getUsersByClinic({ clinicId }: { clinicId: string }) {
    return prisma.user.findMany({
      where: {
        OR: [
          { secretaryProfile: { clinicId } },
          { directorClinicProfile: { clinicId } },
          { referentClinicProfile: { clinicId } },
          {
            veterinarianProfile: { veterinarianClinic: { some: { clinicId } } },
          },
        ],
      },
      omit: { password: true },
    });
  }

  async getUsersByRoleAndClinic({
    clinicId,
    role,
  }: {
    clinicId: string;
    role: UserRole;
  }) {
    return prisma.user.findMany({
      where: {
        role,
        OR: [
          { secretaryProfile: { clinicId } },
          { directorClinicProfile: { clinicId } },
          { referentClinicProfile: { clinicId } },
          {
            veterinarianProfile: { veterinarianClinic: { some: { clinicId } } },
          },
        ],
      },
      omit: { password: true },
    });
  }

  async getUserById({ id }: { id: string }) {
    return prisma.user.findUnique({
      where: { id },
      omit: { password: true },
    });
  }

  async getAllUsers() {
    return prisma.user.findMany({
      include: {
        veterinarianProfile: true,
        clientProfile: true,
        secretaryProfile: true,
        directorClinicProfile: true,
        referentClinicProfile: true,
      },
    });
  }
  async getAllUsersByRole({ role }: { role: UserRole }) {
    return prisma.user.findMany({
      where: { role },
      include: {
        veterinarianProfile: true,
        clientProfile: true,
        secretaryProfile: true,
        directorClinicProfile: true,
        referentClinicProfile: true,
      },
    });
  }
}
