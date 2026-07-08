import { prisma } from "@api/lib/prisma";
import { NotFoundError } from "@api/errors";
import type { ClinicId, UserId } from "@armali/schemas";
import { ReviewService } from "@api/reviews/review.service";
import { StaffService } from "@api/staffs/staff.service";
import { UserService } from "@api/users";
import { ClinicService } from "@api/clinics/clinic.service";
import { MeetingService } from "@api/meetings/meeting.service";
import { OrderRepository } from "@api/orders/order.repository";
import { withAvatarUrl } from "@api/users/user.utils";

// Statuts de commande considérés comme des ventes effectives (exclut PENDING et CANCELLED)
const REVENUE_STATUSES = ["CONFIRMED", "READY", "PICKED_UP"] as const;

export class DashboardService {
  constructor(
    private reviewService: ReviewService,
    private staffService: StaffService,
    private userService: UserService,
    private clinicService: ClinicService,
    private meetingService: MeetingService,
    private orderRepository: OrderRepository,
  ) {}

  // ── Dashboard "gestion de clinique" (référent + directeur, contenu identique) ──
  // Résolution de clinique déléguée à ClinicService.getClinicIdByUserId, déjà
  // générique par rôle — plus de logique dupliquée ici.

  async getClinicDashboard(userId: UserId, role: "REFERENT" | "DIRECTOR") {
    const clinicId: ClinicId = await this.clinicService.getClinicIdByUserId({
      userId,
      role,
    });

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
      this.reviewService.getStats({ userId, role }),
      this.staffService.getStaffCountByUser({
        authorId: userId,
        authorRole: role,
        targetRole: ["VETERINARIAN"],
      }),
      this.staffService.getStaffCountByUser({
        authorId: userId,
        authorRole: role,
        targetRole: ["SECRETARY"],
      }),
      this.staffService.getStaffIdsByUser({
        authorId: userId,
        authorRole: role,
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
            requesterId: userId,
            requesterRole: role,
            targetId: id,
          }),
        ),
        stat: await this.reviewService.getStats({
          veterinarianId: id,
          userId,
          role,
        }),
      })),
    );

    const lowStockCount = clinicProducts.filter(
      (p) => p.stock <= p.minimumRequired,
    ).length;

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
      role,
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

  // ── Dashboard secrétaire ────────────────────────────────────────────────────

  async getSecretaryDashboard(userId: UserId) {
    const clinicId = await this.clinicService.getClinicIdByUserId({
      userId,
      role: "SECRETARY",
    });

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const [pendingOrders, todaysMeetings] = await Promise.all([
      this.orderRepository.findPendingPickupByClinic(clinicId),
      this.meetingService.getAnimalMeetingsByClinic(
        clinicId,
        startOfDay,
        endOfDay,
      ),
    ]);

    return {
      role: "SECRETARY" as const,
      ordersToPrepareCount: pendingOrders.filter(
        (o) => o.status === "CONFIRMED",
      ).length,
      ordersReadyForPickupCount: pendingOrders.filter(
        (o) => o.status === "READY",
      ).length,
      todaysMeetingsCount: todaysMeetings.length,
    };
  }

  // ── Dashboard vétérinaire ────────────────────────────────────────────────────
  // VeterinarianProfile.id === User.id (relation 1-1 portée par le profil),
  // donc pas besoin de résolution supplémentaire : userId sert directement
  // de vetProfileId.

  async getVeterinarianDashboard(userId: UserId) {
    const now = new Date();
    const inSevenDays = new Date();
    inSevenDays.setDate(inSevenDays.getDate() + 7);

    const [upcomingMeetings, rating] = await Promise.all([
      this.meetingService.getAnimalMeetingsAsVet(userId, now, inSevenDays),
      this.reviewService.getStats({
        veterinarianId: userId,
        userId,
        role: "VETERINARIAN",
      }),
    ]);

    return {
      role: "VETERINARIAN" as const,
      upcomingMeetingsCount: upcomingMeetings.length,
      rating: { average: rating.average, count: rating.count },
    };
  }

  // ── Dashboard super admin ────────────────────────────────────────────────────

  async getAdminDashboard() {
    const [
      clinicsCount,
      usersCount,
      pendingClinicRequestsCount,
      pendingProductRequestsCount,
    ] = await Promise.all([
      prisma.clinic.count(),
      prisma.user.count(),
      prisma.clinicRequest.count({ where: { status: "PENDING" } }),
      prisma.productRequest.count({ where: { status: "PENDING" } }),
    ]);

    return {
      role: "ADMIN" as const,
      clinicsCount,
      usersCount,
      pendingClinicRequestsCount,
      pendingProductRequestsCount,
    };
  }
}