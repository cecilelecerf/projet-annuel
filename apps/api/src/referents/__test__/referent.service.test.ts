import { describe, it, expect, vi, beforeEach } from "vitest";
import { BadRequestError, NotFoundError } from "@api/errors";

const mockPrisma = vi.hoisted(() => ({
  referentClinicProfile: { findUnique: vi.fn() },
  clinic: { findUnique: vi.fn() },
  clinicProduct: { findMany: vi.fn() },
  order: { findMany: vi.fn() },
}));

vi.mock("@api/lib/prisma", () => ({ prisma: mockPrisma }));

const mockReviewService = vi.hoisted(() => ({ getStats: vi.fn() }));
const mockStaffService = vi.hoisted(() => ({
  getStaffCountByUser: vi.fn(),
  getStaffIdsByUser: vi.fn(),
}));
const mockUserService = vi.hoisted(() => ({ getUserById: vi.fn() }));

vi.mock("@api/users/user.utils", () => ({
  withAvatarUrl: (user: any) => user,
}));

const { ReferentService } = await import("../referent.service");

const service = new ReferentService(
  mockReviewService as any,
  mockStaffService as any,
  mockUserService as any,
);

beforeEach(() => {
  vi.clearAllMocks();
  // Valeurs par défaut neutres, surchargées dans chaque test au besoin
  mockReviewService.getStats.mockResolvedValue({ average: 0, count: 0 });
  mockStaffService.getStaffCountByUser.mockResolvedValue(0);
  mockStaffService.getStaffIdsByUser.mockResolvedValue([]);
});

const REFERENT_ID = "referent-1" as any;

describe("ReferentService.getDashboard", () => {
  it("BadRequestError si aucun profil référent (clinique introuvable)", async () => {
    mockPrisma.referentClinicProfile.findUnique.mockResolvedValue(null);

    await expect(service.getDashboard(REFERENT_ID)).rejects.toThrow(
      BadRequestError,
    );
  });

  it("NotFoundError si la clinique n'existe plus", async () => {
    mockPrisma.referentClinicProfile.findUnique.mockResolvedValue({
      clinicId: "clinic-1",
    });
    mockPrisma.clinic.findUnique.mockResolvedValue(null);
    mockPrisma.clinicProduct.findMany.mockResolvedValue([]);
    mockPrisma.order.findMany.mockResolvedValue([]);

    await expect(service.getDashboard(REFERENT_ID)).rejects.toThrow(
      NotFoundError,
    );
  });

  it("ne compte le CA que sur les commandes CONFIRMED/READY/PICKED_UP (exclut PENDING et CANCELLED)", async () => {
    mockPrisma.referentClinicProfile.findUnique.mockResolvedValue({
      clinicId: "clinic-1",
    });
    mockPrisma.clinic.findUnique.mockResolvedValue({ name: "Clinique Test" });
    mockPrisma.clinicProduct.findMany.mockResolvedValue([]);
    mockPrisma.order.findMany.mockResolvedValue([
      {
        status: "CONFIRMED",
        createdAt: new Date(),
        orderItems: [{ quantity: 2, unitPrice: 10 }], // 20
      },
      {
        status: "READY",
        createdAt: new Date(),
        orderItems: [{ quantity: 1, unitPrice: 15.5 }], // 15.5
      },
      {
        status: "PICKED_UP",
        createdAt: new Date(),
        orderItems: [{ quantity: 3, unitPrice: 5 }], // 15
      },
      {
        status: "PENDING",
        createdAt: new Date(),
        orderItems: [{ quantity: 10, unitPrice: 100 }], // ignoré
      },
      {
        status: "CANCELLED",
        createdAt: new Date(),
        orderItems: [{ quantity: 10, unitPrice: 100 }], // ignoré
      },
    ]);

    const result = await service.getDashboard(REFERENT_ID);

    expect(result.sales.totalRevenue).toBe(50.5);
    expect(result.sales.totalOrdersCount).toBe(5); // toutes commandes, pas juste les payées
  });

  it("calcule lowStockCount comme le nombre de produits sous ou au seuil minimum", async () => {
    mockPrisma.referentClinicProfile.findUnique.mockResolvedValue({
      clinicId: "clinic-1",
    });
    mockPrisma.clinic.findUnique.mockResolvedValue({ name: "Clinique Test" });
    mockPrisma.order.findMany.mockResolvedValue([]);
    mockPrisma.clinicProduct.findMany.mockResolvedValue([
      { stock: 2, minimumRequired: 5 }, // sous le seuil
      { stock: 5, minimumRequired: 5 }, // égal au seuil (compte comme bas)
      { stock: 10, minimumRequired: 5 }, // au-dessus, ne compte pas
    ]);

    const result = await service.getDashboard(REFERENT_ID);

    expect(result.sales.lowStockCount).toBe(2);
  });

  it("ne compte dans recentOrdersCount que les commandes des 30 derniers jours", async () => {
    mockPrisma.referentClinicProfile.findUnique.mockResolvedValue({
      clinicId: "clinic-1",
    });
    mockPrisma.clinic.findUnique.mockResolvedValue({ name: "Clinique Test" });
    mockPrisma.clinicProduct.findMany.mockResolvedValue([]);

    const recent = new Date();
    const old = new Date();
    old.setDate(old.getDate() - 45);

    mockPrisma.order.findMany.mockResolvedValue([
      { status: "CONFIRMED", createdAt: recent, orderItems: [] },
      { status: "CONFIRMED", createdAt: old, orderItems: [] },
    ]);

    const result = await service.getDashboard(REFERENT_ID);

    expect(result.sales.recentOrdersCount).toBe(1);
    expect(result.sales.totalOrdersCount).toBe(2);
  });

  it("assemble correctement le nom de clinique et les effectifs", async () => {
    mockPrisma.referentClinicProfile.findUnique.mockResolvedValue({
      clinicId: "clinic-1",
    });
    mockPrisma.clinic.findUnique.mockResolvedValue({ name: "Clinique du Parc" });
    mockPrisma.clinicProduct.findMany.mockResolvedValue([]);
    mockPrisma.order.findMany.mockResolvedValue([]);
    mockStaffService.getStaffCountByUser
      .mockResolvedValueOnce(3) // vétérinaires
      .mockResolvedValueOnce(2); // secrétaires

    const result = await service.getDashboard(REFERENT_ID);

    expect(result.clinic).toEqual({
      name: "Clinique du Parc",
      veterinarianCount: 3,
      secretaryCount: 2,
    });
  });

  it("inclut une note par vétérinaire de la clinique", async () => {
    mockPrisma.referentClinicProfile.findUnique.mockResolvedValue({
      clinicId: "clinic-1",
    });
    mockPrisma.clinic.findUnique.mockResolvedValue({ name: "Clinique Test" });
    mockPrisma.clinicProduct.findMany.mockResolvedValue([]);
    mockPrisma.order.findMany.mockResolvedValue([]);
    mockStaffService.getStaffIdsByUser.mockResolvedValue(["vet-1"]);
    mockUserService.getUserById.mockResolvedValue({
      id: "vet-1",
      firstname: "Jean",
    });
    mockReviewService.getStats
      .mockResolvedValueOnce({ average: 4.2, count: 10 }) // stats globales clinique
      .mockResolvedValueOnce({ average: 4.5, count: 6 }); // stats du vétérinaire

    const result = await service.getDashboard(REFERENT_ID);

    expect(result.reviews.veterinarians).toHaveLength(1);
    expect(result.reviews.veterinarians[0].veterinarian.firstname).toBe("Jean");
    expect(result.reviews.veterinarians[0].stat.average).toBe(4.5);
  });
});