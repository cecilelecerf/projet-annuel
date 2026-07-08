import { PrismaClient, User } from "../../prisma/generated/prisma/client";
import { UserRole } from "../../prisma/generated/prisma/enums";
import { userWithProfileAndClinicIdInclude } from "./user.types";

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
  async getAllUsersByRole({ roles }: { roles: UserRole[] }) {
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
    });
  }
}
