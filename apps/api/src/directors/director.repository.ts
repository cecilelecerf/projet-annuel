import { prisma } from "@api/lib/prisma";
import type { CreateClinicRequest } from "@armali/schemas";

export class DirectorRepository {
  findProfileWithClinic(directorUserId: string) {
    return prisma.directorClinicProfile.findUnique({
      where: { id: directorUserId },
      include: { clinic: true },
    });
  }

  findProfile(directorUserId: string) {
    return prisma.directorClinicProfile.findUnique({
      where: { id: directorUserId },
      include: { clinic: true },
    });
  }

  findLatestRequest(directorUserId: string) {
    return prisma.clinicCreationRequest.findFirst({
      where: { directorId: directorUserId },
      orderBy: { createdAt: "desc" },
    });
  }

  findPendingRequestByDirector(directorUserId: string) {
    return prisma.clinicCreationRequest.findFirst({
      where: { directorId: directorUserId, status: "PENDING" },
    });
  }

  findClinicBySiret(siret: string) {
    return prisma.clinic.findUnique({ where: { siret } });
  }

  findPendingRequestBySiret(siret: string) {
    return prisma.clinicCreationRequest.findFirst({
      where: { siret, status: "PENDING" },
    });
  }

  createRequest(directorUserId: string, data: CreateClinicRequest) {
    return prisma.clinicCreationRequest.create({
      data: { ...data, directorId: directorUserId },
    });
  }

  findRequestsByDirector(directorUserId: string) {
    return prisma.clinicCreationRequest.findMany({
      where: { directorId: directorUserId },
      orderBy: { createdAt: "desc" },
    });
  }
}
