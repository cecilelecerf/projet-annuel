import type { PrismaClient } from "../../prisma/generated/prisma/client";

export class ReviewRepository {
  constructor(private prisma: PrismaClient) {}

  async findAllVeterinariansWithReviews() {
    return this.prisma.veterinarianProfile.findMany({
      include: {
        user: { select: { id: true, firstname: true, lastname: true } },
        reviews: { select: { rating: true } },
        veterinarianClinics: {
          include: { clinic: { select: { name: true } } },
        },
      },
    });
  }

  async upsertReview({
    clientId,
    veterinarianId,
    rating,
    comment,
  }: {
    clientId: string;
    veterinarianId: string;
    rating: number;
    comment: string | null;
  }) {
    return this.prisma.vetReview.upsert({
      where: {
        clientId_veterinarianId: { clientId, veterinarianId },
      },
      update: { rating, comment },
      create: { clientId, veterinarianId, rating, comment },
    });
  }

  async findReviewsByClient(clientId: string) {
    return this.prisma.vetReview.findMany({
      where: { clientId },
      include: {
        veterinarian: {
          include: { user: { select: { firstname: true, lastname: true } } },
        },
      },
      orderBy: { updatedAt: "desc" },
    });
  }

  async findReviewsByVeterinarian(veterinarianId: string) {
    return this.prisma.vetReview.findMany({
      where: { veterinarianId },
      include: {
        client: { select: { firstname: true, lastname: true } },
      },
      orderBy: { updatedAt: "desc" },
    });
  }
}
