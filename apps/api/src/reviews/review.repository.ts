import {
  ClientId,
  ClinicId,
  UserId,
  VeterinarianClinicId,
  VeterinarianId,
} from "@armali/schemas";
import type {
  Prisma,
  PrismaClient,
} from "../../prisma/generated/prisma/client";

const reviewWithRelationsInclude = {
  veterinarianClinic: {
    include: {
      veterinarian: { include: { user: { include: { avatar: true } } } },
      clinic: true,
    },
  },
  client: { include: { user: { include: { avatar: true } } } },
} satisfies Prisma.ReviewInclude;

export type ReviewWithRelationsInclude = Prisma.ReviewGetPayload<{
  include: typeof reviewWithRelationsInclude;
}>;
export class ReviewRepository {
  constructor(private prisma: PrismaClient) {}

  async upsertReview({
    clientId,
    veterinarianClinicId,
    rating,
    comment,
  }: {
    clientId: string;
    veterinarianClinicId: string;
    rating: number;
    comment: string | null;
  }) {
    return this.prisma.review.upsert({
      where: {
        clientId_veterinarianClinicId: { clientId, veterinarianClinicId },
      },
      update: { rating, comment },
      create: { clientId, veterinarianClinicId, rating, comment },
    });
  }

  async findAll() {
    return this.prisma.review.findMany({
      include: reviewWithRelationsInclude,
      orderBy: { updatedAt: "desc" },
    });
  }

  async findReviewsByClient(clientId: ClientId) {
    return this.prisma.review.findMany({
      where: { clientId },
      include: reviewWithRelationsInclude,
      orderBy: { updatedAt: "desc" },
    });
  }

  async findReviewsByClinic({ clinicId }: { clinicId: ClinicId }) {
    return this.prisma.review.findMany({
      where: { veterinarianClinic: { clinicId } },
      include: reviewWithRelationsInclude,
      orderBy: { updatedAt: "desc" },
    });
  }

  async findReviewsByVeterinarian(
    veterinarianId: VeterinarianId,
    clinicId?: ClinicId,
  ) {
    return this.prisma.review.findMany({
      where: { veterinarianClinic: { veterinarianId, clinicId } },
      include: reviewWithRelationsInclude,
      orderBy: { updatedAt: "desc" },
    });
  }

  async findKeys({
    clientId,
    veterinarianClinicId,
  }: {
    clientId: ClientId;
    veterinarianClinicId: VeterinarianClinicId;
  }) {
    return this.prisma.review.findUnique({
      where: {
        clientId_veterinarianClinicId: { veterinarianClinicId, clientId },
      },
      include: reviewWithRelationsInclude,
    });
  }

  async getGlobalStats() {
    const result = await this.prisma.review.aggregate({
      _avg: { rating: true },
      _count: { _all: true },
    });
    return { average: result._avg.rating, count: result._count._all };
  }

  async getStatsByVeterinarian(veterinarianId: UserId, clinicId?: ClinicId) {
    const result = await this.prisma.review.aggregate({
      where: { veterinarianClinic: { veterinarianId, clinicId } },
      _avg: { rating: true },
      _count: { _all: true },
    });
    return { average: result._avg.rating, count: result._count._all };
  }

  async getStatsByClinic(clinicId: ClinicId) {
    const result = await this.prisma.review.aggregate({
      where: { veterinarianClinic: { clinicId } },
      _avg: { rating: true },
      _count: { _all: true },
    });
    return { average: result._avg.rating, count: result._count._all };
  }

  async getStatsByClient(clientId: UserId) {
    const result = await this.prisma.review.aggregate({
      where: { clientId },
      _avg: { rating: true },
      _count: { _all: true },
    });
    return { average: result._avg.rating, count: result._count._all };
  }
}
