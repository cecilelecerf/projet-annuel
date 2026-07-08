import { PrismaClient } from "../../prisma/generated/prisma/client";
import { conversationMemberUserSelect } from "./messaging.types";

export class ContactsRepository {
  constructor(private prisma: PrismaClient) {}
  // TODO : delete this, is in clinic repository and service
  async listClinicColleagues(clinicId: string, excludeUserId: string) {
    return this.prisma.user.findMany({
      where: {
        id: { not: excludeUserId },
        OR: [
          { secretaryProfile: { clinicId } },
          { directorClinicProfile: { clinic: { id: clinicId } } },
          { referentClinicProfile: { clinicId } },
          {
            veterinarianProfile: {
              veterinarianClinics: { some: { clinicId } },
            },
          },
        ],
      },
      select: conversationMemberUserSelect,
      orderBy: [{ lastname: "asc" }, { firstname: "asc" }],
    });
  }
  // TODO : delete this, is in user repository and service

  async listDirectors(excludeUserId: string) {
    return this.prisma.user.findMany({
      where: { role: "DIRECTOR", id: { not: excludeUserId } },
      select: conversationMemberUserSelect,
      orderBy: [{ lastname: "asc" }, { firstname: "asc" }],
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
