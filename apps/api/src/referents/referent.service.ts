import { prisma } from "@api/lib/prisma";
import { BadRequestError, NotFoundError } from "@api/errors";
import { ReviewRepository } from "@api/reviews/review.repository";
import {
  ClinicId,
  ReviewMeta,
  reviewMetaSchema,
  VeterinarianId,
} from "@armali/schemas";

// Statuts de commande considérés comme des ventes effectives (exclut PENDING et CANCELLED)
const REVENUE_STATUSES = ["CONFIRMED", "READY", "PICKED_UP"] as const;

export class ReferentService {
  constructor(private reviewRepository: ReviewRepository) {}
  private async getClinicId(referentUserId: string): Promise<string> {
    const profile = await prisma.referentClinicProfile.findUnique({
      where: { id: referentUserId },
    });
    if (!profile)
      throw new BadRequestError(
        "Aucune clinique associée à ce compte référent",
      );
    return profile.clinicId;
  }

  // ── Dashboard (page d'accueil référent) ───────────────────────────────────

  async getDashboard(referentUserId: string) {
    const clinicId: ClinicId = (await this.getClinicId(
      referentUserId,
    )) as ClinicId;

    const [clinic, reviews, staffCounts, clinicProducts, orders] =
      await Promise.all([
        prisma.clinic.findUnique({
          where: { id: clinicId },
          select: { name: true },
        }),
        this.reviewRepository.findReviewsByClinic({ clinicId }),
        // prisma.veterinarianClinic.findMany({
        Promise.all([
          prisma.veterinarianClinic.count({ where: { clinicId } }),
          prisma.secretaryProfile.count({ where: { clinicId } }),
        ]),

        prisma.clinicProduct.findMany({
          where: { clinicId },
          select: { stock: true, minimumRequired: true },
        }),

        prisma.order.findMany({
          where: { clinicId },
          select: {
            status: true,
            createdAt: true,
            orderItems: { select: { quantity: true, unitPrice: true } },
          },
        }),
      ]);

    if (!clinic) throw new NotFoundError("Clinique");

    // ── Stats vétérinaires ──────────────────────────────────────────────
    const reviewsGroupByVeterinarian: Record<VeterinarianId, ReviewMeta[]> =
      reviews.reduce(
        (acc, review) => {
          console.log(review);
          const formatReview = {
            ...review,
            client: review.client.user,
            clinic: review.veterinarianClinic.clinic,
            veterinarian: review.veterinarianClinic.veterinarian.user,
          };
          const r = reviewMetaSchema.parse(formatReview);
          const id = r.veterinarian.id;
          acc[id] = [...(acc[id] ?? []), r];
          return acc;
        },
        {} as Record<VeterinarianId, ReviewMeta[]>,
      );

    const veterinarianStats = (
      Object.entries(reviewsGroupByVeterinarian) as [
        VeterinarianId,
        ReviewMeta[],
      ][]
    )
      .map(([vetoId, reviews]) => {
        const sumRating = reviews.reduce((acc, review) => {
          acc += review.rating;
          return acc;
        }, 0);
        return {
          id: vetoId,
          firstname: reviews[0].veterinarian.firstname,
          lastname: reviews[0].veterinarian.lastname,
          reviewCount: reviews.length,
          averageRating: reviews.length
            ? Math.round((sumRating / reviews.length) * 10) / 10
            : null,
        };
      })
      .filter((stat) => stat.averageRating !== null);

    const allRatings = Object.keys(reviewsGroupByVeterinarian).length;
    const clinicAverageRating =
      reviews.length > 0
        ? Math.round(
            (veterinarianStats.reduce((s, r) => s + r.averageRating!, 0) /
              reviews.length) *
              10,
          ) / 10
        : null;

    // ── Stats stock ─────────────────────────────────────────────────────
    const lowStockCount = clinicProducts.filter(
      (p) => p.stock <= p.minimumRequired,
    ).length;

    // ── Stats ventes ────────────────────────────────────────────────────
    const revenueOrders = orders.filter((o) =>
      (REVENUE_STATUSES as readonly string[]).includes(o.status),
    );
    const totalRevenue = revenueOrders.reduce(
      (sum, order) =>
        sum +
        order.orderItems.reduce(
          (itemSum, item) => itemSum + item.quantity * Number(item.unitPrice),
          0,
        ),
      0,
    );

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentOrdersCount = orders.filter(
      (o) => o.createdAt >= thirtyDaysAgo,
    ).length;

    return {
      clinic: {
        name: clinic.name,
        veterinarianCount: staffCounts[0],
        secretaryCount: staffCounts[1],
      },
      reviews: {
        clinicAverageRating,
        totalReviews: allRatings,
        veterinarianStats,
      },
      sales: {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalOrdersCount: orders.length,
        recentOrdersCount,
        lowStockCount,
      },
    };
  }
}
