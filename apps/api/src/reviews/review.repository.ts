import { ClientId, ClinicId, VeterinarianClinicId } from "@armali/schemas";
import type {
  Prisma,
  PrismaClient,
} from "../../prisma/generated/prisma/client";

const reviewWithRelationsInclude = {
  veterinarianClinic: {
    include: { veterinarian: { include: { user: true } }, clinic: true },
  },
  client: { include: { user: true } },
} satisfies Prisma.ReviewInclude;

export class ReviewRepository {
  constructor(private prisma: PrismaClient) {}

  async findAllVeterinariansWithReviews() {
    return this.prisma.veterinarianProfile.findMany({
      include: {
        user: { select: { id: true, firstname: true, lastname: true } },
        veterinarianClinics: {
          include: { clinic: { select: { name: true } }, reviews: true },
        },
      },
    });
  }

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
      include: {
        client: { select: { user: true } },
        veterinarianClinic: {
          select: { veterinarian: { select: { user: true } }, clinic: true },
        },
      },
    });
  }

  async findReviewsByVeterinarian(veterinarianId: string) {
    return this.prisma.review.findMany({
      where: { veterinarianClinic: { veterinarianId } },
      include: {
        client: {
          select: { user: { select: { firstname: true, lastname: true } } },
        },
      },
      orderBy: { updatedAt: "desc" },
    });
  }
}
