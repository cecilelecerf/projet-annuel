import { describe, it, expect, vi, beforeEach } from "vitest";
import { NotFoundError } from "@api/errors";

const mockPrisma = vi.hoisted(() => ({
  clinic: { findUnique: vi.fn(), count: vi.fn() },
  clinicProduct: { findMany: vi.fn() },
  order: { findMany: vi.fn() },
  user: { count: vi.fn() },
  clinicRequest: { count: vi.fn() },
  productRequest: { count: vi.fn() },
}));
vi.mock("@api/lib/prisma", () => ({ prisma: mockPrisma }));

const mockReviewService = vi.hoisted(() => ({ getStats: vi.fn() }));
const mockStaffService = vi.hoisted(() => ({
  getStaffCountByUser: vi.fn(),
  getStaffIdsByUser: vi.fn(),
}));
const mockUserService = vi.hoisted(() => ({ getUserById: vi.fn() }));
const mockClinicService = vi.hoisted(() => ({ getClinicIdByUserId: vi.fn() }));
const mockMeetingService = vi.hoisted(() => ({
  getAnimalMeetingsByClinic: vi.fn(),
  getAnimalMeetingsAsVet: vi.fn(),
}));
const mockOrderRepository = vi.hoisted(() => ({
  findPendingPickupByClinic: vi.fn(),
}));

vi.mock("@api/users/user.utils", () => ({
  withAvatarUrl: (user: any) => user,
}));

const { DashboardService } = await import("../dashboard.service");

const service = new DashboardService(
  mockReviewService as any,
  mockStaffService as any,
  mockUserService as any,
  mockClinicService as any,
  mockMeetingService as any,
  mockOrderRepository as any,
);

beforeEach(() => {
  vi.clearAllMocks();
  mockReviewService.getStats.mockResolvedValue({ average: null, count: 0 });
  mockStaffService.getStaffCountByUser.mockResolvedValue(0);
  mockStaffService.getStaffIdsByUser.mockResolvedValue([]);
});

// ── getClinicDashboard (référent + directeur) ────────────────────────────────

describe("DashboardService.getClinicDashboard", () => {
  it.each<"REFERENT" | "DIRECTOR">(["REFERENT", "DIRECTOR"])(
    "%s — résout la clinique via ClinicService et attache le rôle au résultat",
    async (role) => {
      mockClinicService.getClinicIdByUserId.mockResolvedValue("clinic-1");
      mockPrisma.clinic.findUnique.mockResolvedValue({ name: "Clinique Test" });
      mockPrisma.clinicProduct.findMany.mockResolvedValue([]);
      mockPrisma.order.findMany.mockResolvedValue([]);

      const result = await service.getClinicDashboard("user-1" as any, role);

      expect(mockClinicService.getClinicIdByUserId).toHaveBeenCalledWith({
        userId: "user-1",
        role,
      });
      expect(result.role).toBe(role);
    },
  );

  it("NotFoundError si la clinique n'existe plus", async () => {
    mockClinicService.getClinicIdByUserId.mockResolvedValue("clinic-1");
    mockPrisma.clinic.findUnique.mockResolvedValue(null);
    mockPrisma.clinicProduct.findMany.mockResolvedValue([]);
    mockPrisma.order.findMany.mockResolvedValue([]);

    await expect(
      service.getClinicDashboard("user-1" as any, "REFERENT"),
    ).rejects.toThrow(NotFoundError);
  });

  it("ne compte le CA que sur CONFIRMED/READY/PICKED_UP", async () => {
    mockClinicService.getClinicIdByUserId.mockResolvedValue("clinic-1");
    mockPrisma.clinic.findUnique.mockResolvedValue({ name: "Clinique Test" });
    mockPrisma.clinicProduct.findMany.mockResolvedValue([]);
    mockPrisma.order.findMany.mockResolvedValue([
      { status: "CONFIRMED", createdAt: new Date(), orderItems: [{ quantity: 2, unitPrice: 10 }] },
      { status: "PENDING", createdAt: new Date(), orderItems: [{ quantity: 10, unitPrice: 100 }] },
      { status: "CANCELLED", createdAt: new Date(), orderItems: [{ quantity: 10, unitPrice: 100 }] },
    ]);

    const result = await service.getClinicDashboard("user-1" as any, "REFERENT");

    expect(result.sales.totalRevenue).toBe(20);
    expect(result.sales.totalOrdersCount).toBe(3);
  });

  it("calcule lowStockCount (stock <= minimumRequired)", async () => {
    mockClinicService.getClinicIdByUserId.mockResolvedValue("clinic-1");
    mockPrisma.clinic.findUnique.mockResolvedValue({ name: "Clinique Test" });
    mockPrisma.order.findMany.mockResolvedValue([]);
    mockPrisma.clinicProduct.findMany.mockResolvedValue([
      { stock: 2, minimumRequired: 5 },
      { stock: 5, minimumRequired: 5 },
      { stock: 20, minimumRequired: 5 },
    ]);

    const result = await service.getClinicDashboard("user-1" as any, "DIRECTOR");

    expect(result.sales.lowStockCount).toBe(2);
  });

  it("assemble la liste des vétérinaires avec leur note individuelle", async () => {
    mockClinicService.getClinicIdByUserId.mockResolvedValue("clinic-1");
    mockPrisma.clinic.findUnique.mockResolvedValue({ name: "Clinique Test" });
    mockPrisma.clinicProduct.findMany.mockResolvedValue([]);
    mockPrisma.order.findMany.mockResolvedValue([]);
    mockStaffService.getStaffIdsByUser.mockResolvedValue(["vet-1"]);
    mockUserService.getUserById.mockResolvedValue({ id: "vet-1", firstname: "Jean" });
    mockReviewService.getStats
      .mockResolvedValueOnce({ average: 4.0, count: 12 }) // stats clinique
      .mockResolvedValueOnce({ average: 4.5, count: 6 }); // stats du vétérinaire

    const result = await service.getClinicDashboard("user-1" as any, "REFERENT");

    expect(result.reviews.veterinarians).toHaveLength(1);
    expect(result.reviews.veterinarians[0].veterinarian.firstname).toBe("Jean");
    expect(result.reviews.veterinarians[0].stat.average).toBe(4.5);
  });
});

// ── getSecretaryDashboard ─────────────────────────────────────────────────────

describe("DashboardService.getSecretaryDashboard", () => {
  it("résout la clinique via ClinicService avec le rôle SECRETARY", async () => {
    mockClinicService.getClinicIdByUserId.mockResolvedValue("clinic-1");
    mockOrderRepository.findPendingPickupByClinic.mockResolvedValue([]);
    mockMeetingService.getAnimalMeetingsByClinic.mockResolvedValue([]);

    await service.getSecretaryDashboard("user-1" as any);

    expect(mockClinicService.getClinicIdByUserId).toHaveBeenCalledWith({
      userId: "user-1",
      role: "SECRETARY",
    });
  });

  it("sépare les commandes à préparer (CONFIRMED) des prêtes à récupérer (READY)", async () => {
    mockClinicService.getClinicIdByUserId.mockResolvedValue("clinic-1");
    mockOrderRepository.findPendingPickupByClinic.mockResolvedValue([
      { id: "o1", status: "CONFIRMED" },
      { id: "o2", status: "CONFIRMED" },
      { id: "o3", status: "READY" },
    ]);
    mockMeetingService.getAnimalMeetingsByClinic.mockResolvedValue([]);

    const result = await service.getSecretaryDashboard("user-1" as any);

    expect(result.role).toBe("SECRETARY");
    expect(result.ordersToPrepareCount).toBe(2);
    expect(result.ordersReadyForPickupCount).toBe(1);
  });

  it("compte les RDV du jour de la clinique via meetingService.getAnimalMeetingsByClinic", async () => {
    mockClinicService.getClinicIdByUserId.mockResolvedValue("clinic-1");
    mockOrderRepository.findPendingPickupByClinic.mockResolvedValue([]);
    mockMeetingService.getAnimalMeetingsByClinic.mockResolvedValue([
      { id: "m1" },
      { id: "m2" },
    ]);

    const result = await service.getSecretaryDashboard("user-1" as any);

    expect(mockMeetingService.getAnimalMeetingsByClinic).toHaveBeenCalledWith(
      "clinic-1",
      expect.any(Date),
      expect.any(Date),
    );
    expect(result.todaysMeetingsCount).toBe(2);
  });
});

// ── getVeterinarianDashboard ───────────────────────────────────────────────

describe("DashboardService.getVeterinarianDashboard", () => {
  it("utilise userId directement comme vetProfileId (PK partagée)", async () => {
    mockMeetingService.getAnimalMeetingsAsVet.mockResolvedValue([]);
    mockReviewService.getStats.mockResolvedValue({ average: null, count: 0 });

    await service.getVeterinarianDashboard("vet-1" as any);

    expect(mockMeetingService.getAnimalMeetingsAsVet).toHaveBeenCalledWith(
      "vet-1",
      expect.any(Date),
      expect.any(Date),
    );
    expect(mockReviewService.getStats).toHaveBeenCalledWith({
      veterinarianId: "vet-1",
      userId: "vet-1",
      role: "VETERINARIAN",
    });
  });

  it("retourne le nombre de RDV à venir et la note du vétérinaire", async () => {
    mockMeetingService.getAnimalMeetingsAsVet.mockResolvedValue([
      { id: "m1" },
      { id: "m2" },
      { id: "m3" },
    ]);
    mockReviewService.getStats.mockResolvedValue({ average: 4.7, count: 21 });

    const result = await service.getVeterinarianDashboard("vet-1" as any);

    expect(result.role).toBe("VETERINARIAN");
    expect(result.upcomingMeetingsCount).toBe(3);
    expect(result.rating).toEqual({ average: 4.7, count: 21 });
  });
});

// ── getAdminDashboard ─────────────────────────────────────────────────────────

describe("DashboardService.getAdminDashboard", () => {
  it("assemble les compteurs plateforme, dont seules les demandes PENDING", async () => {
    mockPrisma.clinic.count.mockResolvedValue(12);
    mockPrisma.user.count.mockResolvedValue(340);
    mockPrisma.clinicRequest.count.mockResolvedValue(3);
    mockPrisma.productRequest.count.mockResolvedValue(7);

    const result = await service.getAdminDashboard();

    expect(mockPrisma.clinicRequest.count).toHaveBeenCalledWith({
      where: { status: "PENDING" },
    });
    expect(mockPrisma.productRequest.count).toHaveBeenCalledWith({
      where: { status: "PENDING" },
    });
    expect(result).toEqual({
      role: "ADMIN",
      clinicsCount: 12,
      usersCount: 340,
      pendingClinicRequestsCount: 3,
      pendingProductRequestsCount: 7,
    });
  });
});