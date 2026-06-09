import { prisma } from "@api/lib/prisma";
import type { CreateReview } from "@armali/schemas";

export class ReviewService {
  async listVeterinarians() {
    const vets = await prisma.veterinarianProfile.findMany({
      include: {
        user: { select: { id: true, firstname: true, lastname: true } },
        reviews: { select: { rating: true } },
        veterinarianClinic: {
          include: { clinic: { select: { name: true } } },
        },
      },
    });

    return vets.map((v) => {
      const avg =
        v.reviews.length > 0
          ? v.reviews.reduce((sum, r) => sum + r.rating, 0) / v.reviews.length
          : null;
      return {
        id: v.id,
        firstname: v.user.firstname,
        lastname: v.user.lastname,
        bio: v.bio,
        clinics: v.veterinarianClinic.map((vc) => vc.clinic.name),
        averageRating: avg ? Math.round(avg * 10) / 10 : null,
        reviewCount: v.reviews.length,
      };
    });
  }

  async upsertReview(clientId: string, data: CreateReview) {
    return prisma.vetReview.upsert({
      where: {
        clientId_veterinarianId: {
          clientId,
          veterinarianId: data.veterinarianId,
        },
      },
      update: {
        rating: data.rating,
        comment: data.comment ?? null,
      },
      create: {
        clientId,
        veterinarianId: data.veterinarianId,
        rating: data.rating,
        comment: data.comment ?? null,
      },
    });
  }

  async getMyReviews(clientId: string) {
    return prisma.vetReview.findMany({
      where: { clientId },
      include: {
        veterinarian: {
          include: {
            user: { select: { firstname: true, lastname: true } },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });
  }

  async getVetReviews(veterinarianId: string) {
    return prisma.vetReview.findMany({
      where: { veterinarianId },
      include: {
        client: { select: { firstname: true, lastname: true } },
      },
      orderBy: { updatedAt: "desc" },
    });
  }
}
