import { prisma } from "@api/lib/prisma";
import { NotFoundError } from "@api/errors";
import type { ClinicId, UserId, VeterinarianId } from "@armali/schemas";
import { ReviewService } from "@api/reviews/review.service";
import { ReviewRepository } from "@api/reviews/review.repository";
import { UserService } from "@api/users";
import { ClinicService } from "@api/clinics/clinic.service";
import { MeetingService } from "@api/meetings/meeting.service";
import { OrderRepository } from "@api/orders/order.repository";
import { StaffService } from "@api/clinics/staffs/staff.service";
import { AnimalRepository } from "@api/animals/animal.repository";
import {
  AnimalMeetingService,
  AvailabilityService,
  InternalMeetingService,
} from "@api/meetings";

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
    private reviewRepository: ReviewRepository,
    private animalRepsository: AnimalRepository,
    private animalMeetingService: AnimalMeetingService,
    private internalMeetingService: InternalMeetingService,
    private availabilityService: AvailabilityService,
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
        veterinarian: await this.userService.getUserById({
          requesterId: userId,
          requesterRole: role,
          targetId: id,
        }),

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

    const [
      pendingOrders,
      todaysAnimalMeetings,
      veterinarianCount,
      secretaryCount,
      vetIds,
    ] = await Promise.all([
      this.orderRepository.findPendingPickupByClinic(clinicId),
      this.animalMeetingService.getAnimalMeetingsByClinic(
        clinicId,
        startOfDay,
        endOfDay,
      ),
      this.staffService.getStaffCountByUser({
        authorId: userId,
        authorRole: "SECRETARY",
        targetRole: ["VETERINARIAN"],
      }),
      this.staffService.getStaffCountByUser({
        authorId: userId,
        authorRole: "SECRETARY",
        targetRole: ["SECRETARY"],
      }),
      this.staffService.getStaffIdsByUser({
        authorId: userId,
        authorRole: "SECRETARY",
        targetRole: ["VETERINARIAN"],
      }),
    ]);

    // ── Vétérinaires présents aujourd'hui (disponibilité, pas juste RDV) ─────
    const presenceChecks = await Promise.all(
      vetIds.map(async (vetId) => {
        const avails = await this.availabilityService.getAvailabilities({
          userId: vetId,
          start: startOfDay,
          end: endOfDay,
          clinicIds: [clinicId],
        });
        return avails.length > 0 ? vetId : null;
      }),
    );
    const presentVetIds = presenceChecks.filter(
      (id): id is UserId => id !== null,
    );
    const presentVets = presentVetIds.length
      ? await prisma.user.findMany({
          where: { id: { in: presentVetIds } },
          select: { id: true, firstname: true, lastname: true },
        })
      : [];

    const toPrepare = pendingOrders.filter((o) => o.status === "CONFIRMED");
    const ready = pendingOrders.filter((o) => o.status === "READY");

    const mapOrder = (o: (typeof pendingOrders)[number]) => ({
      id: o.id,
      clientName: `${o.client.firstname} ${o.client.lastname}`,
      items: o.orderItems
        .map((i) => `${i.quantity}× ${i.productClinic.product.name}`)
        .join(", "),
      total: o.orderItems.reduce(
        (sum, i) => sum + Number(i.unitPrice) * i.quantity,
        0,
      ),
    });

    // ── Enrichissement des RDV du jour (animal + vétérinaire) ────────────────
    const animalMeetings = todaysAnimalMeetings.filter(
      (m): m is typeof m & { animalId: string } => "animalId" in m,
    );
    const animalIds = [...new Set(animalMeetings.map((m) => m.animalId))];
    const vetClinicIds = [
      ...new Set(
        animalMeetings
          .map(
            (m) =>
              (m as unknown as { veterinarianClinicId?: string })
                .veterinarianClinicId,
          )
          .filter((id): id is string => !!id),
      ),
    ];

    const [animals, vetClinics] = await Promise.all([
      animalIds.length
        ? prisma.animal.findMany({
            where: { id: { in: animalIds } },
            select: { id: true, name: true },
          })
        : Promise.resolve([]),
      vetClinicIds.length
        ? prisma.veterinarianClinic.findMany({
            where: { id: { in: vetClinicIds } },
            select: {
              id: true,
              veterinarian: {
                select: {
                  user: { select: { firstname: true, lastname: true } },
                },
              },
            },
          })
        : Promise.resolve([]),
    ]);
    const animalById = new Map(animals.map((a) => [a.id, a]));
    const vetClinicById = new Map(vetClinics.map((v) => [v.id, v]));

    const todaysMeetings = animalMeetings
      .sort(
        (a, b) =>
          new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
      )
      .map((m) => {
        const animal = animalById.get(m.animalId);
        const vetClinicId = (m as unknown as { veterinarianClinicId?: string })
          .veterinarianClinicId;
        const vc = vetClinicId ? vetClinicById.get(vetClinicId) : undefined;
        return {
          startTime: new Date(m.startTime).toISOString(),
          endTime: new Date(m.endTime).toISOString(),
          animalName: animal?.name ?? "—",
          veterinarianName: vc
            ? `${vc.veterinarian.user.firstname} ${vc.veterinarian.user.lastname}`
            : "—",
        };
      });

    return {
      role: "SECRETARY" as const,
      ordersToPrepareCount: toPrepare.length,
      ordersReadyForPickupCount: ready.length,
      ordersToPrepare: toPrepare.map(mapOrder),
      ordersReadyForPickup: ready.map(mapOrder),
      todaysMeetingsCount: todaysMeetings.length,
      todaysMeetings,
      staff: { veterinarianCount, secretaryCount },
      presentVeterinarians: presentVets.map((v) => ({
        id: v.id,
        firstname: v.firstname,
        lastname: v.lastname,
      })),
    };
  }

  // ── Dashboard vétérinaire ────────────────────────────────────────────────────

  async getVeterinarianDashboard(userId: UserId) {
    const now = new Date();
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);
    const inSevenDays = new Date();
    inSevenDays.setDate(inSevenDays.getDate() + 7);

    const [weekMeetings, rating, recentReviewsRaw, patientsCount] =
      await Promise.all([
        this.animalMeetingService.getAnimalMeetingsAsVet(
          userId,
          now,
          inSevenDays,
        ),
        this.reviewService.getStats({
          veterinarianId: userId,
          userId,
          role: "VETERINARIAN",
        }),
        this.reviewRepository.findReviewsByVeterinarian(
          userId as unknown as VeterinarianId,
        ),
        this.animalRepsository.countByAttendingVeterinarian(userId),
      ]);

    const todaysMeetingsCount = weekMeetings.filter(
      (m) => new Date(m.date) <= endOfToday,
    ).length;

    // Prochains RDV enrichis (animal + client) — uniquement les entrées
    // issues d'un rendez-vous animalier (celles qui portent un animalId)
    const upcomingAnimalMeetings = weekMeetings
      .filter((m): m is typeof m & { animalId: string } => "animalId" in m)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 5);

    const animalIds = [
      ...new Set(upcomingAnimalMeetings.map((m) => m.animalId)),
    ];
    const animals = animalIds.length
      ? await prisma.animal.findMany({
          where: { id: { in: animalIds } },
          select: {
            id: true,
            name: true,
            client: {
              select: { user: { select: { firstname: true, lastname: true } } },
            },
          },
        })
      : [];
    const animalById = new Map(animals.map((a) => [a.id, a]));

    const upcomingMeetings = upcomingAnimalMeetings.map((m) => {
      const animal = animalById.get(m.animalId);
      return {
        date: new Date(m.date).toISOString(),
        startTime: new Date(m.startTime).toISOString(),
        endTime: new Date(m.endTime).toISOString(),
        animalName: animal?.name ?? "—",
        clientName: animal
          ? `${animal.client.user.firstname} ${animal.client.user.lastname}`
          : "—",
      };
    });

    const recentReviews = recentReviewsRaw.slice(0, 3).map((r) => ({
      rating: r.rating,
      comment: r.comment,
      clientName: `${r.client.user.firstname} ${r.client.user.lastname}`,
      date: r.updatedAt.toISOString(),
    }));

    return {
      role: "VETERINARIAN" as const,
      todaysMeetingsCount,
      upcomingMeetingsCount: weekMeetings.length,
      upcomingMeetings,
      rating: { average: rating.average, count: rating.count },
      recentReviews,
      patientsCount,
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
