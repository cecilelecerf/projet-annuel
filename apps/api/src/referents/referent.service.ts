import { prisma } from "@api/lib/prisma";
import { BadRequestError, NotFoundError } from "@api/errors";
import type {
  UpdateClinicReferent,
  UpdateClinicSpecialities,
} from "@armali/schemas";

// Statuts de commande considérés comme des ventes effectives (exclut PENDING et CANCELLED)
const REVENUE_STATUSES = ["CONFIRMED", "READY", "PICKED_UP"] as const;

export class ReferentService {
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

  async updateClinic(referentUserId: string, data: UpdateClinicReferent) {
    const clinicId = await this.getClinicId(referentUserId);

    return prisma.clinic.update({
      where: { id: clinicId },
      data,
    });
  }

  async getClinicSpecialities(referentUserId: string) {
    const clinicId = await this.getClinicId(referentUserId);
    const clinic = await prisma.clinic.findUnique({
      where: { id: clinicId },
      include: { specialities: true },
    });
    return clinic?.specialities ?? [];
  }

  async updateClinicSpecialities(
    referentUserId: string,
    data: UpdateClinicSpecialities,
  ) {
    const clinicId = await this.getClinicId(referentUserId);
    const clinic = await prisma.clinic.update({
      where: { id: clinicId },
      data: {
        specialities: {
          set: data.specialityIds.map((id) => ({ id })),
        },
      },
      include: { specialities: true },
    });
    return clinic.specialities;
  }

  // ── Dashboard (page d'accueil référent) ───────────────────────────────────

  async getDashboard(referentUserId: string) {
    const clinicId = await this.getClinicId(referentUserId);

    const [clinic, vetClinics, staffCounts, clinicProducts, orders] =
      await Promise.all([
        prisma.clinic.findUnique({
          where: { id: clinicId },
          select: { name: true },
        }),
        // Vétérinaires de la clinique + leurs avis
        prisma.veterinarianClinic.findMany({
          where: { clinicId },
          include: {
            veterinarian: {
              include: {
                user: { select: { firstname: true, lastname: true } },
                reviews: { select: { rating: true } },
              },
            },
          },
        }),
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
    const veterinarianStats = vetClinics.map((vc) => {
      const reviews = vc.veterinarian.reviews;
      const avg =
        reviews.length > 0
          ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
          : null;
      return {
        id: vc.veterinarianId,
        firstname: vc.veterinarian.user.firstname,
        lastname: vc.veterinarian.user.lastname,
        averageRating: avg ? Math.round(avg * 10) / 10 : null,
        reviewCount: reviews.length,
      };
    });

    const allRatings = vetClinics.flatMap((vc) =>
      vc.veterinarian.reviews.map((r) => r.rating),
    );
    const clinicAverageRating =
      allRatings.length > 0
        ? Math.round(
            (allRatings.reduce((s, r) => s + r, 0) / allRatings.length) * 10,
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
        totalReviews: allRatings.length,
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
