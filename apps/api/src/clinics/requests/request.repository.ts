import type { CreateClinicRequest } from "@armali/schemas";
import { PrismaClient } from "../../../prisma/generated/prisma/client";

export class ClinicRequestRepository {
  constructor(private readonly prisma: PrismaClient) {}

  // ── Demande d'un directeur ────────────────────────────────────────────────

  findProfileWithClinic(directorUserId: string) {
    return this.prisma.directorClinicProfile.findUnique({
      where: { id: directorUserId },
      include: { clinic: true },
    });
  }

  findLatestRequest(directorUserId: string) {
    return this.prisma.clinicCreationRequest.findFirst({
      where: { directorId: directorUserId },
      orderBy: { createdAt: "desc" },
    });
  }

  findPendingRequestByDirector(directorUserId: string) {
    return this.prisma.clinicCreationRequest.findFirst({
      where: { directorId: directorUserId, status: "PENDING" },
    });
  }

  findClinicBySiret(siret: string) {
    return this.prisma.clinic.findUnique({ where: { siret } });
  }

  findPendingRequestBySiret(siret: string) {
    return this.prisma.clinicCreationRequest.findFirst({
      where: { siret, status: "PENDING" },
    });
  }

  createRequest(directorUserId: string, data: CreateClinicRequest) {
    return this.prisma.clinicCreationRequest.create({
      data: { ...data, directorId: directorUserId },
    });
  }

  findRequestsByDirector(directorUserId: string) {
    return this.prisma.clinicCreationRequest.findMany({
      where: { directorId: directorUserId },
      orderBy: { createdAt: "desc" },
    });
  }

  // ── Administration des demandes ───────────────────────────────────────────

  findAllRequests() {
    return this.prisma.clinicCreationRequest.findMany({
      include: {
        director: {
          select: {
            user: {
              select: {
                id: true,
                firstname: true,
                lastname: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  findRequestById(requestId: string) {
    return this.prisma.clinicCreationRequest.findUnique({
      where: { id: requestId },
    });
  }

  rejectRequest(requestId: string) {
    return this.prisma.clinicCreationRequest.update({
      where: { id: requestId },
      data: { status: "REJECTED" },
    });
  }

  /**
   * Crée la Clinic et marque la demande comme APPROVED dans la même
   * transaction : la logique de transaction reste ici, le service n'a
   * pas besoin de connaître Prisma.
   */
  approveRequest(
    request: {
      id: string;
      name: string;
      address: string;
      siret: string;
      phone: string;
      website: string;
      description: string | null;
      directorId: string;
    },
    geo: { lat: number; lng: number },
  ) {
    return this.prisma.$transaction(async (tx) => {
      await tx.clinic.create({
        data: {
          name: request.name,
          address: request.address,
          siret: request.siret,
          phone: request.phone,
          website: request.website,
          description: request.description ?? undefined,
          directorId: request.directorId,
          lat: geo.lat,
          lng: geo.lng,
        },
      });

      return tx.clinicCreationRequest.update({
        where: { id: request.id },
        data: { status: "APPROVED" },
      });
    });
  }
}
