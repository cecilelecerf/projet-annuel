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
}
