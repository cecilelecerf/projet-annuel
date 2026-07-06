import { prisma } from "@api/lib/prisma";
import { BadRequestError, ConflictError, NotFoundError } from "@api/errors";

export class AdminService {
  async getClinicRequests() {
    return prisma.clinicCreationRequest.findMany({
      include: {
        director: {
          select: { id: true, firstname: true, lastname: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async approveClinicRequest(requestId: string) {
    const request = await prisma.clinicCreationRequest.findUnique({
      where: { id: requestId },
    });
    if (!request) throw new NotFoundError("Demande");
    if (request.status !== "PENDING") {
      throw new BadRequestError("Cette demande a déjà été traitée");
    }

    const existingClinic = await prisma.clinic.findUnique({
      where: { siret: request.siret },
    });
    if (existingClinic) {
      throw new ConflictError(
        "Une clinique avec ce numéro SIRET existe déjà. Veuillez rejeter cette demande."
      );
    }

    await prisma.$transaction(async (tx) => {
      const clinic = await tx.clinic.create({
        data: {
          name: request.name,
          address: request.address,
          siret: request.siret,
          phone: request.phone,
          website: request.website,
          description: request.description ?? undefined,
        },
      });

      await tx.directorClinicProfile.upsert({
        where: { id: request.directorId },
        update: { clinicId: clinic.id },
        create: { id: request.directorId, clinicId: clinic.id },
      });

      await tx.clinicCreationRequest.update({
        where: { id: requestId },
        data: { status: "APPROVED" },
      });
    });

    return { message: "Demande approuvée, clinique créée" };
  }

  async rejectClinicRequest(requestId: string) {
    const request = await prisma.clinicCreationRequest.findUnique({
      where: { id: requestId },
    });
    if (!request) throw new NotFoundError("Demande");

    return prisma.clinicCreationRequest.update({
      where: { id: requestId },
      data: { status: "REJECTED" },
    });
  }

  async getClinics() {
    return prisma.clinic.findMany({ orderBy: { createdAt: "desc" } });
  }

  async deleteClinic(clinicId: string) {
    const clinic = await prisma.clinic.findUnique({
      where: { id: clinicId },
    });
    if (!clinic) throw new NotFoundError("Clinique");

    const [orderCount, meetingCount, appointmentCount, medicalHistoryCount] =
      await Promise.all([
        prisma.order.count({ where: { clinicId } }),
        prisma.internalMeeting.count({ where: { clinicId } }),
        prisma.animalMeeting.count({
          where: { veterinarianClinic: { clinicId } },
        }),
        prisma.animalMedicalHistory.count({
          where: { clinicAct: { clinicId } },
        }),
      ]);

    const reasons: string[] = [];
    if (orderCount > 0)
      reasons.push(
        `${orderCount} commande${orderCount > 1 ? "s" : ""} en cours ou passée${orderCount > 1 ? "s" : ""}`,
      );
    if (meetingCount > 0)
      reasons.push(
        `${meetingCount} réunion${meetingCount > 1 ? "s" : ""} interne${meetingCount > 1 ? "s" : ""}`,
      );
    if (appointmentCount > 0)
      reasons.push(
        `${appointmentCount} rendez-vous vétérinaire${appointmentCount > 1 ? "s" : ""}`,
      );
    if (medicalHistoryCount > 0)
      reasons.push(
        `${medicalHistoryCount} entrée${medicalHistoryCount > 1 ? "s" : ""} d'historique médical`,
      );

    if (reasons.length > 0) {
      throw new BadRequestError(
        `Impossible de supprimer la clinique « ${clinic.name} » car elle a encore : ${reasons.join(", ")}. Veuillez d'abord supprimer ou transférer ces éléments.`,
      );
    }

    await prisma.clinic.delete({ where: { id: clinicId } });
    return { message: "Clinique supprimée" };
  }
}
