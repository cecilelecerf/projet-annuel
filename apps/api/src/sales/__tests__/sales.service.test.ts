import { describe, it, expect, vi, beforeEach } from "vitest";
import { ForbiddenError } from "@api/errors";
import type { UserRole } from "@armali/schemas";

const mockPrisma = vi.hoisted(() => ({
  referentClinicProfile: { findUnique: vi.fn() },
  clinic: { findFirst: vi.fn() },
  order: { findMany: vi.fn() },
}));
vi.mock("@api/lib/prisma", () => ({ prisma: mockPrisma }));

const { SalesService } = await import("../sales.service");

const service = new SalesService();

beforeEach(() => vi.clearAllMocks());

const makeOrder = (overrides = {}) => ({
  id: "order-1",
  status: "CONFIRMED",
  createdAt: new Date("2026-06-01T10:00:00Z"),
  client: { user: { firstname: "Alice", lastname: "Durand", email: "a@a.fr" } },
  clinic: { name: "Clinique du Parc" },
  orderItems: [
    {
      quantity: 2,
      unitPrice: 10,
      productClinic: { product: { name: "Croquettes", picture: null } },
    },
  ],
  ...overrides,
});

// ── Résolution de clinique (rôle + accès) ────────────────────────────────────

describe("SalesService.getReport — résolution de clinique", () => {
  it.each<UserRole>(["SECRETARY", "VETERINARIAN", "CLIENT", "ADMIN"])(
    "%s — ForbiddenError, réservé référent/directeur",
    async (role) => {
      await expect(service.getReport("user-1", role)).rejects.toThrow(
        ForbiddenError,
      );
    },
  );

  it("REFERENT — ForbiddenError si aucun profil clinique", async () => {
    mockPrisma.referentClinicProfile.findUnique.mockResolvedValue(null);

    await expect(service.getReport("user-1", "REFERENT")).rejects.toThrow(
      ForbiddenError,
    );
  });

  it("DIRECTOR — ForbiddenError si aucune clinique dirigée", async () => {
    mockPrisma.clinic.findFirst.mockResolvedValue(null);

    await expect(service.getReport("user-1", "DIRECTOR")).rejects.toThrow(
      ForbiddenError,
    );
  });

  it("REFERENT — résout la clinique via ReferentClinicProfile.clinicId", async () => {
    mockPrisma.referentClinicProfile.findUnique.mockResolvedValue({
      clinicId: "clinic-1",
    });
    mockPrisma.order.findMany.mockResolvedValue([]);

    await service.getReport("user-1", "REFERENT");

    expect(mockPrisma.order.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ clinicId: "clinic-1" }),
      }),
    );
  });

  it("DIRECTOR — résout la clinique via Clinic.directorId (pas de clinicId direct sur le profil)", async () => {
    mockPrisma.clinic.findFirst.mockResolvedValue({ id: "clinic-2" });
    mockPrisma.order.findMany.mockResolvedValue([]);

    await service.getReport("user-1", "DIRECTOR");

    expect(mockPrisma.order.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ clinicId: "clinic-2" }),
      }),
    );
  });
});

// ── Filtre de période ──────────────────────────────────────────────────────

describe("SalesService.getReport — filtre de période", () => {
  beforeEach(() => {
    mockPrisma.referentClinicProfile.findUnique.mockResolvedValue({
      clinicId: "clinic-1",
    });
    mockPrisma.order.findMany.mockResolvedValue([]);
  });

  it("aucun filtre de date si ni from ni to ne sont fournis", async () => {
    await service.getReport("user-1", "REFERENT");

    const callArgs = mockPrisma.order.findMany.mock.calls[0][0];
    expect(callArgs.where.createdAt).toBeUndefined();
  });

  it("applique gte/lte quand from et to sont fournis", async () => {
    await service.getReport(
      "user-1",
      "REFERENT",
      "2026-06-01T00:00:00.000Z",
      "2026-06-30T23:59:59.000Z",
    );

    const callArgs = mockPrisma.order.findMany.mock.calls[0][0];
    expect(callArgs.where.createdAt.gte).toEqual(
      new Date("2026-06-01T00:00:00.000Z"),
    );
    expect(callArgs.where.createdAt.lte).toEqual(
      new Date("2026-06-30T23:59:59.000Z"),
    );
  });

  it("filtre uniquement les statuts considérés comme vente (CONFIRMED/READY/PICKED_UP)", async () => {
    await service.getReport("user-1", "REFERENT");

    const callArgs = mockPrisma.order.findMany.mock.calls[0][0];
    expect(callArgs.where.status).toEqual({
      in: ["CONFIRMED", "READY", "PICKED_UP"],
    });
  });
});

// ── Agrégations (résumé, courbe, top produits) ───────────────────────────────

describe("SalesService.getReport — agrégations", () => {
  beforeEach(() => {
    mockPrisma.referentClinicProfile.findUnique.mockResolvedValue({
      clinicId: "clinic-1",
    });
  });

  it("résumé vide si aucune commande sur la période", async () => {
    mockPrisma.order.findMany.mockResolvedValue([]);

    const result = await service.getReport("user-1", "REFERENT");

    expect(result.summary).toEqual({
      totalRevenue: 0,
      orderCount: 0,
      averageOrderValue: 0,
    });
    expect(result.revenueOverTime).toEqual([]);
    expect(result.topProducts).toEqual([]);
  });

  it("calcule totalRevenue, orderCount et averageOrderValue", async () => {
    mockPrisma.order.findMany.mockResolvedValue([
      makeOrder({ orderItems: [{ quantity: 2, unitPrice: 10, productClinic: { product: { name: "A" } } }] }), // 20
      makeOrder({ orderItems: [{ quantity: 1, unitPrice: 30, productClinic: { product: { name: "B" } } }] }), // 30
    ]);

    const result = await service.getReport("user-1", "REFERENT");

    expect(result.summary.totalRevenue).toBe(50);
    expect(result.summary.orderCount).toBe(2);
    expect(result.summary.averageOrderValue).toBe(25);
  });

  it("regroupe le CA par jour, trié par date croissante", async () => {
    mockPrisma.order.findMany.mockResolvedValue([
      makeOrder({
        createdAt: new Date("2026-06-03T10:00:00Z"),
        orderItems: [{ quantity: 1, unitPrice: 10, productClinic: { product: { name: "A" } } }],
      }),
      makeOrder({
        createdAt: new Date("2026-06-01T10:00:00Z"),
        orderItems: [{ quantity: 1, unitPrice: 5, productClinic: { product: { name: "A" } } }],
      }),
      makeOrder({
        createdAt: new Date("2026-06-01T18:00:00Z"), // même jour que la précédente
        orderItems: [{ quantity: 1, unitPrice: 5, productClinic: { product: { name: "A" } } }],
      }),
    ]);

    const result = await service.getReport("user-1", "REFERENT");

    expect(result.revenueOverTime).toEqual([
      { date: "2026-06-01", revenue: 10 }, // 5 + 5, deux commandes le même jour
      { date: "2026-06-03", revenue: 10 },
    ]);
  });

  it("agrège les top produits par CA généré, triés décroissant", async () => {
    mockPrisma.order.findMany.mockResolvedValue([
      makeOrder({
        orderItems: [
          { quantity: 1, unitPrice: 100, productClinic: { product: { name: "Produit cher" } } },
        ],
      }),
      makeOrder({
        orderItems: [
          { quantity: 5, unitPrice: 5, productClinic: { product: { name: "Produit populaire" } } },
        ],
      }),
      makeOrder({
        orderItems: [
          { quantity: 2, unitPrice: 5, productClinic: { product: { name: "Produit populaire" } } },
        ],
      }),
    ]);

    const result = await service.getReport("user-1", "REFERENT");

    expect(result.topProducts).toEqual([
      { productName: "Produit cher", quantitySold: 1, revenue: 100 },
      { productName: "Produit populaire", quantitySold: 7, revenue: 35 },
    ]);
  });

  it("limite le top produits à 10 entrées", async () => {
    const orders = Array.from({ length: 15 }, (_, i) =>
      makeOrder({
        orderItems: [
          {
            quantity: 1,
            unitPrice: 15 - i, // CA décroissant pour un ordre de tri déterministe
            productClinic: { product: { name: `Produit ${i}` } },
          },
        ],
      }),
    );
    mockPrisma.order.findMany.mockResolvedValue(orders);

    const result = await service.getReport("user-1", "REFERENT");

    expect(result.topProducts).toHaveLength(10);
    expect(result.topProducts[0].productName).toBe("Produit 0"); // le plus cher
  });

  it("aplatit client.user en client directement sur chaque commande retournée", async () => {
    mockPrisma.order.findMany.mockResolvedValue([makeOrder()]);

    const result = await service.getReport("user-1", "REFERENT");

    expect(result.orders[0].client).toEqual({
      firstname: "Alice",
      lastname: "Durand",
      email: "a@a.fr",
    });
  });
});