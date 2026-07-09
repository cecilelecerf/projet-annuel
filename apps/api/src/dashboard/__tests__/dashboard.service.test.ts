import { describe, it, expect, vi, beforeEach } from "vitest";
import { NotFoundError } from "@api/errors";

const mockPrisma = vi.hoisted(() => ({
  clinic: { findUnique: vi.fn(), count: vi.fn() },
  clinicProduct: { findMany: vi.fn() },
  order: { findMany: vi.fn() },
  user: { count: vi.fn(), findMany: vi.fn() },
  clinicRequest: { count: vi.fn() },
  productRequest: { count: vi.fn() },
  animal: { count: vi.fn(), findMany: vi.fn() },
  veterinarianClinic: { findMany: vi.fn() },
}));
vi.mock("@api/lib/prisma", () => ({ prisma: mockPrisma }));

const mockReviewService = vi.hoisted(() => ({ getStats: vi.fn() }));
const mockReviewRepository = vi.hoisted(() => ({
  findReviewsByVeterinarian: vi.fn(),
}));
const mockStaffService = vi.hoisted(() => ({
  getStaffCountByUser: vi.fn(),
  getStaffIdsByUser: vi.fn(),
}));
const mockUserService = vi.hoisted(() => ({ getUserById: vi.fn() }));
const mockClinicService = vi.hoisted(() => ({ getClinicIdByUserId: vi.fn() }));
const mockMeetingService = vi.hoisted(() => ({
  getAnimalMeetingsByClinic: vi.fn(),
  getAnimalMeetingsAsVet: vi.fn(),
  getAvailabilities: vi.fn(),
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
  mockReviewRepository as any,
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

const makeOrder = (overrides = {}) => ({
  id: "order-1",
  status: "CONFIRMED",
  client: { firstname: "Alice", lastname: "Durand" },
  orderItems: [
    { quantity: 2, unitPrice: 10, productClinic: { product: { name: "Croquettes" } } },
  ],
  ...overrides,
});

const makeAnimalMeeting = (overrides = {}) => ({
  id: "meeting-1",
  date: new Date(),
  startTime: new Date("2026-01-01T10:00:00Z"),
  endTime: new Date("2026-01-01T10:30:00Z"),
  animalId: "animal-1",
  veterinarianClinicId: "vc-1",
  ...overrides,
});

describe("DashboardService.getSecretaryDashboard", () => {
  beforeEach(() => {
    mockClinicService.getClinicIdByUserId.mockResolvedValue("clinic-1");
    mockOrderRepository.findPendingPickupByClinic.mockResolvedValue([]);
    mockMeetingService.getAnimalMeetingsByClinic.mockResolvedValue([]);
    mockMeetingService.getAvailabilities.mockResolvedValue([]);
    mockPrisma.animal.findMany.mockResolvedValue([]);
    mockPrisma.veterinarianClinic.findMany.mockResolvedValue([]);
    mockPrisma.user.findMany.mockResolvedValue([]);
  });

  it("résout la clinique via ClinicService avec le rôle SECRETARY", async () => {
    await service.getSecretaryDashboard("user-1" as any);

    expect(mockClinicService.getClinicIdByUserId).toHaveBeenCalledWith({
      userId: "user-1",
      role: "SECRETARY",
    });
  });

  it("sépare les commandes CONFIRMED/READY et résume client + articles", async () => {
    mockOrderRepository.findPendingPickupByClinic.mockResolvedValue([
      makeOrder({ id: "o1", status: "CONFIRMED" }),
      makeOrder({ id: "o2", status: "READY" }),
    ]);

    const result = await service.getSecretaryDashboard("user-1" as any);

    expect(result.ordersToPrepareCount).toBe(1);
    expect(result.ordersReadyForPickupCount).toBe(1);
    expect(result.ordersToPrepare[0]).toEqual({
      id: "o1",
      clientName: "Alice Durand",
      items: "2× Croquettes",
      total: 20,
    });
  });

  it("enrichit les RDV du jour avec le nom de l'animal et du vétérinaire", async () => {
    mockMeetingService.getAnimalMeetingsByClinic.mockResolvedValue([
      makeAnimalMeeting(),
    ]);
    mockPrisma.animal.findMany.mockResolvedValue([
      { id: "animal-1", name: "Rex" },
    ]);
    mockPrisma.veterinarianClinic.findMany.mockResolvedValue([
      {
        id: "vc-1",
        veterinarian: { user: { firstname: "Claire", lastname: "Moreau" } },
      },
    ]);

    const result = await service.getSecretaryDashboard("user-1" as any);

    expect(result.todaysMeetingsCount).toBe(1);
    expect(result.todaysMeetings[0]).toMatchObject({
      animalName: "Rex",
      veterinarianName: "Claire Moreau",
    });
  });

  it("ne considère un vétérinaire présent que s'il a une disponibilité aujourd'hui", async () => {
    mockStaffService.getStaffIdsByUser.mockResolvedValue(["vet-1", "vet-2"]);
    mockMeetingService.getAvailabilities.mockImplementation(({ userId }: any) =>
      Promise.resolve(userId === "vet-1" ? [{ id: "avail-1" }] : []),
    );
    mockPrisma.user.findMany.mockResolvedValue([
      { id: "vet-1", firstname: "Claire", lastname: "Moreau" },
    ]);

    const result = await service.getSecretaryDashboard("user-1" as any);

    expect(result.presentVeterinarians).toHaveLength(1);
    expect(result.presentVeterinarians[0].firstname).toBe("Claire");
  });

  it("staff reflète les compteurs vétérinaires/secrétaires de la clinique", async () => {
    mockStaffService.getStaffCountByUser
      .mockResolvedValueOnce(4) // véto
      .mockResolvedValueOnce(2); // secrétaires

    const result = await service.getSecretaryDashboard("user-1" as any);

    expect(result.staff).toEqual({ veterinarianCount: 4, secretaryCount: 2 });
  });
});

// ── getVeterinarianDashboard ───────────────────────────────────────────────

describe("DashboardService.getVeterinarianDashboard", () => {
  beforeEach(() => {
    mockMeetingService.getAnimalMeetingsAsVet.mockResolvedValue([]);
    mockReviewService.getStats.mockResolvedValue({ average: null, count: 0 });
    mockReviewRepository.findReviewsByVeterinarian.mockResolvedValue([]);
    mockPrisma.animal.count.mockResolvedValue(0);
    mockPrisma.animal.findMany.mockResolvedValue([]);
  });

  it("utilise userId directement comme vetProfileId (PK partagée)", async () => {
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

  it("sépare todaysMeetingsCount et upcomingMeetingsCount (semaine)", async () => {
    const today = new Date();
    const in3Days = new Date();
    in3Days.setDate(in3Days.getDate() + 3);

    mockMeetingService.getAnimalMeetingsAsVet.mockResolvedValue([
      makeAnimalMeeting({ date: today }),
      makeAnimalMeeting({ id: "m2", date: in3Days, animalId: "animal-2" }),
    ]);
    mockPrisma.animal.findMany.mockResolvedValue([
      { id: "animal-1", name: "Rex", client: { user: { firstname: "A", lastname: "B" } } },
      { id: "animal-2", name: "Milo", client: { user: { firstname: "C", lastname: "D" } } },
    ]);

    const result = await service.getVeterinarianDashboard("vet-1" as any);

    expect(result.todaysMeetingsCount).toBe(1);
    expect(result.upcomingMeetingsCount).toBe(2);
  });

  it("enrichit les prochains RDV avec animal + client, limités à 5, triés par date", async () => {
    const meetings = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() + i);
      return makeAnimalMeeting({
        id: `m${i}`,
        date,
        startTime: date,
        endTime: date,
        animalId: `animal-${i}`,
      });
    });
    mockMeetingService.getAnimalMeetingsAsVet.mockResolvedValue(meetings);
    mockPrisma.animal.findMany.mockResolvedValue(
      Array.from({ length: 7 }, (_, i) => ({
        id: `animal-${i}`,
        name: `Animal${i}`,
        client: { user: { firstname: "Client", lastname: `${i}` } },
      })),
    );

    const result = await service.getVeterinarianDashboard("vet-1" as any);

    expect(result.upcomingMeetings).toHaveLength(5);
    expect(result.upcomingMeetings[0].animalName).toBe("Animal0");
  });

  it("retourne les 3 derniers avis avec commentaire et nom du client", async () => {
    mockReviewRepository.findReviewsByVeterinarian.mockResolvedValue([
      {
        rating: 5,
        comment: "Excellent",
        client: { user: { firstname: "Alice", lastname: "Durand" } },
        updatedAt: new Date("2026-01-01"),
      },
      {
        rating: 4,
        comment: null,
        client: { user: { firstname: "Bob", lastname: "Martin" } },
        updatedAt: new Date("2026-01-02"),
      },
    ]);

    const result = await service.getVeterinarianDashboard("vet-1" as any);

    expect(result.recentReviews).toHaveLength(2);
    expect(result.recentReviews[0]).toMatchObject({
      rating: 5,
      comment: "Excellent",
      clientName: "Alice Durand",
    });
  });

  it("compte les patients distincts via Animal.attendingVeterinarianId", async () => {
    mockPrisma.animal.count.mockResolvedValue(17);

    const result = await service.getVeterinarianDashboard("vet-1" as any);

    expect(mockPrisma.animal.count).toHaveBeenCalledWith({
      where: { attendingVeterinarianId: "vet-1" },
    });
    expect(result.patientsCount).toBe(17);
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