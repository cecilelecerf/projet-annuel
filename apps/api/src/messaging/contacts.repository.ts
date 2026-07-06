import { prisma } from "@api/lib/prisma";
import { conversationMemberUserSelect } from "./messaging.types";

export class ContactsRepository {
  async listClinicColleagues(clinicId: string, excludeUserId: string) {
    return prisma.user.findMany({
      where: {
        id: { not: excludeUserId },
        OR: [
          { secretaryProfile: { clinicId } },
          { directorClinicProfile: { clinicId } },
          { referentClinicProfile: { clinicId } },
          { veterinarianProfile: { veterinarianClinic: { some: { clinicId } } } },
        ],
      },
      select: conversationMemberUserSelect,
      orderBy: [{ lastname: "asc" }, { firstname: "asc" }],
    });
  }

  async listDirectors(excludeUserId: string) {
    return prisma.user.findMany({
      where: { role: "DIRECTOR", id: { not: excludeUserId } },
      select: conversationMemberUserSelect,
      orderBy: [{ lastname: "asc" }, { firstname: "asc" }],
    });
  }

  async findUsersWithClinicIds(userIds: string[]) {
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      include: {
        secretaryProfile: { select: { clinicId: true } },
        directorClinicProfile: { select: { clinicId: true } },
        referentClinicProfile: { select: { clinicId: true } },
        veterinarianProfile: {
          include: { veterinarianClinic: { select: { clinicId: true } } },
        },
      },
    });

    return users.map((user) => {
      let clinicIds: string[] = [];
      switch (user.role) {
        case "SECRETARY":
          clinicIds = user.secretaryProfile ? [user.secretaryProfile.clinicId] : [];
          break;
        case "DIRECTOR":
          clinicIds = user.directorClinicProfile
            ? [user.directorClinicProfile.clinicId]
            : [];
          break;
        case "REFERANT":
          clinicIds = user.referentClinicProfile
            ? [user.referentClinicProfile.clinicId]
            : [];
          break;
        case "VETERINARIAN":
          clinicIds =
            user.veterinarianProfile?.veterinarianClinic.map((c) => c.clinicId) ??
            [];
          break;
      }
      return { id: user.id, role: user.role, clinicIds };
    });
  }
}
