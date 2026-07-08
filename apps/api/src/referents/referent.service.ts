import { prisma } from "@api/lib/prisma";
import { BadRequestError, NotFoundError } from "@api/errors";
import { ClinicId, ReferentClinicId } from "@armali/schemas";
import { ReviewService } from "@api/reviews/review.service";
import { StaffService } from "@api/staffs/staff.service";
import { UserService } from "@api/users";
import { withAvatarUrl } from "@api/users/user.utils";

// Statuts de commande considérés comme des ventes effectives (exclut PENDING et CANCELLED)
const REVENUE_STATUSES = ["CONFIRMED", "READY", "PICKED_UP"] as const;

export class ReferentService {
  constructor(
    private reviewService: ReviewService,
    private staffService: StaffService,
    private userService: UserService,
  ) {}
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

  async getDashboard(referentUserId: ReferentClinicId) {
    const clinicId: ClinicId = (await this.getClinicId(
      referentUserId,
    )) as ClinicId;

    const [
      clinic,
      reviewStat,
      vetoCounts,
      secretaryCounts,
      vetoIds,
      clinicProducts,
      orders,
    ] = await Promise.all([
      prisma.clinic.findUnique({
        where: { id: clinicId },
        select: { name: true },
      }),
      this.reviewService.getStats({
        userId: referentUserId,
        role: "REFERENT",
      }),
      this.staffService.getStaffCountByUser({
        authorId: referentUserId,
        authorRole: "REFERENT",
        targetRole: ["VETERINARIAN"],
      }),
      this.staffService.getStaffCountByUser({
        authorId: referentUserId,
        authorRole: "REFERENT",
        targetRole: ["SECRETARY"],
      }),
      this.staffService.getStaffIdsByUser({
        authorId: referentUserId,
        authorRole: "REFERENT",
        targetRole: ["VETERINARIAN"],
      }),

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
    const reviews = await Promise.all(
      vetoIds.map(async (id) => ({
        veterinarian: withAvatarUrl(
          await this.userService.getUserById({
            requesterId: referentUserId,
            requesterRole: "REFERENT",
            targetId: id,
          }),
        ),
        stat: await this.reviewService.getStats({
          veterinarianId: id,
          userId: referentUserId,
          role: "REFERENT",
        }),
      })),
    );
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
        veterinarianCount: vetoCounts,
        secretaryCount: secretaryCounts,
      },
      reviews: {
        average: reviewStat.average,
        count: reviewStat.count,
        veterinarians: reviews,
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
