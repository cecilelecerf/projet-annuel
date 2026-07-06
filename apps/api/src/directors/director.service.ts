import { prisma } from "@api/lib/prisma";
import { BadRequestError, ConflictError } from "@api/errors";
import type { CreateClinicRequest } from "@armali/schemas";

export class DirectorService {
  async getClinicStatus(directorUserId: string) {
    const profile = await prisma.directorClinicProfile.findUnique({
      where: { id: directorUserId },
      include: { clinic: true },
    });
    if (profile) return { status: "APPROVED" as const, clinic: profile.clinic };

    const latestRequest = await prisma.clinicCreationRequest.findFirst({
      where: { directorId: directorUserId },
      orderBy: { createdAt: "desc" },
    });

    if (!latestRequest) return { status: "NONE" as const };
    if (latestRequest.status === "PENDING")
      return { status: "PENDING" as const, request: latestRequest };
    if (latestRequest.status === "REJECTED")
      return { status: "REJECTED" as const, request: latestRequest };

    return { status: "NONE" as const };
  }

  async requestClinic(directorUserId: string, data: CreateClinicRequest) {
    const profile = await prisma.directorClinicProfile.findUnique({
      where: { id: directorUserId },
    });
    if (profile)
      throw new BadRequestError("Vous avez déjà une clinique approuvée");

    const pendingRequest = await prisma.clinicCreationRequest.findFirst({
      where: { directorId: directorUserId, status: "PENDING" },
    });
    if (pendingRequest)
      throw new ConflictError(
        "Vous avez déjà une demande en attente de validation",
      );

    const existingClinic = await prisma.clinic.findUnique({
      where: { siret: data.siret },
    });
    if (existingClinic)
      throw new ConflictError("Une clinique avec ce numéro SIRET existe déjà");

    const siretPending = await prisma.clinicCreationRequest.findFirst({
      where: { siret: data.siret, status: "PENDING" },
    });
    if (siretPending)
      throw new ConflictError(
        "Une demande avec ce numéro SIRET est déjà en attente",
      );

    return prisma.clinicCreationRequest.create({
      data: { ...data, directorId: directorUserId },
    });
  }

  async getMyRequests(directorUserId: string) {
    return prisma.clinicCreationRequest.findMany({
      where: { directorId: directorUserId },
      orderBy: { createdAt: "desc" },
    });
  }
}
