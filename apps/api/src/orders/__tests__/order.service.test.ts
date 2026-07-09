import { describe, it, expect, vi, beforeEach } from "vitest";
import { BadRequestError, ForbiddenError, NotFoundError } from "@api/errors";

const mockPrisma = vi.hoisted(() => ({
  user: { findUnique: vi.fn() },
  clinicProduct: { findUnique: vi.fn() },
  secretaryProfile: { findUnique: vi.fn() },
  clientProfile: { findUnique: vi.fn() },
  clinic: { findUnique: vi.fn() },
}));
vi.mock("@api/lib/prisma", () => ({ prisma: mockPrisma }));

const mockStripe = vi.hoisted(() => ({
  checkout: { sessions: { create: vi.fn() } },
}));
vi.mock("@api/lib/stripe", () => ({ stripe: mockStripe }));

const mockGetClientClinicIds = vi.hoisted(() => vi.fn());
vi.mock("@api/shop/shop.service", () => ({
  getClientClinicIds: mockGetClientClinicIds,
}));

const mockRepository = vi.hoisted(() => ({
  createWithItems: vi.fn(),
  attachStripeSession: vi.fn(),
  findByStripeSession: vi.fn(),
  confirmPayment: vi.fn(),
  findByClient: vi.fn(),
  findById: vi.fn(),
  cancelByStripeSession: vi.fn(),
  findPendingPickupByClinic: vi.fn(),
  markReady: vi.fn(),
  findByClinicAndPickupCode: vi.fn(),
  markPickedUp: vi.fn(),
}));
vi.mock("../order.repository", () => ({
  OrderRepository: vi.fn(function () {
    return mockRepository;
  }),
}));

const mockEmailService = vi.hoisted(() => ({
  sendOrderConfirmation: vi.fn(),
  sendOrderReady: vi.fn(),
}));

const { OrderRepository } = await import("../order.repository");
const { OrderService } = await import("../order.service");

const service = new OrderService(
  new OrderRepository({} as any),
  mockEmailService as any,
);

beforeEach(() => vi.clearAllMocks());

// ── checkout ─────────────────────────────────────────────────────────────────

describe("OrderService.checkout", () => {
  const baseData = {
    groups: [
      {
        clinicId: "clinic-1",
        items: [{ productClinicId: "cp-1", quantity: 2 }],
      },
    ],
  } as any;

  it("ForbiddenError si la clinique n'est pas accessible au client", async () => {
    mockGetClientClinicIds.mockResolvedValue(["clinic-autre"]);
    mockPrisma.user.findUnique.mockResolvedValue({ id: "client-1", email: "c@c.fr" });

    await expect(service.checkout("client-1", baseData)).rejects.toThrow(
      ForbiddenError,
    );
  });

  it("NotFoundError si le client n'existe pas", async () => {
    mockGetClientClinicIds.mockResolvedValue(["clinic-1"]);
    mockPrisma.user.findUnique.mockResolvedValue(null);

    await expect(service.checkout("client-1", baseData)).rejects.toThrow(
      NotFoundError,
    );
  });

  it("BadRequestError si le produit n'appartient pas à la clinique du groupe", async () => {
    mockGetClientClinicIds.mockResolvedValue(["clinic-1"]);
    mockPrisma.user.findUnique.mockResolvedValue({ id: "client-1", email: "c@c.fr" });
    mockPrisma.clinicProduct.findUnique.mockResolvedValue({
      id: "cp-1",
      clinicId: "clinic-AUTRE",
      stock: 10,
      price: 20,
      product: { name: "Croquettes" },
    });

    await expect(service.checkout("client-1", baseData)).rejects.toThrow(
      BadRequestError,
    );
  });

  it("BadRequestError si le stock est insuffisant", async () => {
    mockGetClientClinicIds.mockResolvedValue(["clinic-1"]);
    mockPrisma.user.findUnique.mockResolvedValue({ id: "client-1", email: "c@c.fr" });
    mockPrisma.clinicProduct.findUnique.mockResolvedValue({
      id: "cp-1",
      clinicId: "clinic-1",
      stock: 1, // < quantity demandée (2)
      price: 20,
      product: { name: "Croquettes" },
    });

    await expect(service.checkout("client-1", baseData)).rejects.toThrow(
      BadRequestError,
    );
  });

  it("crée la/les commande(s), la session Stripe, et l'attache aux commandes", async () => {
    mockGetClientClinicIds.mockResolvedValue(["clinic-1"]);
    mockPrisma.user.findUnique.mockResolvedValue({ id: "client-1", email: "c@c.fr" });
    mockPrisma.clinicProduct.findUnique.mockResolvedValue({
      id: "cp-1",
      clinicId: "clinic-1",
      stock: 10,
      price: 20,
      product: { name: "Croquettes" },
    });
    mockRepository.createWithItems.mockResolvedValue({ id: "order-1" });
    mockStripe.checkout.sessions.create.mockResolvedValue({
      id: "sess_123",
      url: "https://checkout.stripe.com/sess_123",
    });

    const result = await service.checkout("client-1", baseData);

    expect(mockRepository.createWithItems).toHaveBeenCalledWith(
      "client-1",
      "clinic-1",
      [{ productClinicId: "cp-1", quantity: 2, unitPrice: 20 }],
    );
    expect(mockStripe.checkout.sessions.create).toHaveBeenCalled();
    expect(mockRepository.attachStripeSession).toHaveBeenCalledWith(
      ["order-1"],
      "sess_123",
    );
    expect(result.checkoutUrl).toBe("https://checkout.stripe.com/sess_123");
    expect(result.orders).toEqual([{ id: "order-1" }]);
  });
});

// ── handlePaymentSuccess (webhook Stripe) ─────────────────────────────────────

describe("OrderService.handlePaymentSuccess", () => {
  it("ne fait rien si aucune commande n'est liée à la session", async () => {
    mockRepository.findByStripeSession.mockResolvedValue([]);

    await service.handlePaymentSuccess("sess_123");

    expect(mockRepository.confirmPayment).not.toHaveBeenCalled();
    expect(mockEmailService.sendOrderConfirmation).not.toHaveBeenCalled();
  });

  it("ignore les commandes qui ne sont plus PENDING (déjà traitées)", async () => {
    mockRepository.findByStripeSession.mockResolvedValue([
      { id: "order-1", status: "CONFIRMED", clientId: "client-1" },
    ]);

    await service.handlePaymentSuccess("sess_123");

    expect(mockRepository.confirmPayment).not.toHaveBeenCalled();
  });

  it("confirme le paiement et envoie l'email de confirmation pour une commande PENDING", async () => {
    mockRepository.findByStripeSession.mockResolvedValue([
      { id: "order-1", status: "PENDING", clientId: "client-1" },
    ]);
    mockRepository.confirmPayment.mockResolvedValue({
      id: "order-1",
      clinic: { name: "Clinique du Parc" },
      orderItems: [
        {
          quantity: 2,
          unitPrice: 10,
          productClinic: { product: { name: "Croquettes" } },
        },
      ],
    });
    mockPrisma.user.findUnique.mockResolvedValue({
      email: "client@c.fr",
      firstname: "Alice",
    });

    await service.handlePaymentSuccess("sess_123");

    expect(mockRepository.confirmPayment).toHaveBeenCalledWith(
      "order-1",
      expect.any(String), // code de retrait généré aléatoirement
    );
    expect(mockEmailService.sendOrderConfirmation).toHaveBeenCalledWith(
      "client@c.fr",
      "Alice",
      expect.objectContaining({
        clinicName: "Clinique du Parc",
        total: 20,
      }),
    );
  });
});

// ── getMyOrders / getOrderById ─────────────────────────────────────────────

describe("OrderService.getOrderById", () => {
  it("NotFoundError si la commande n'existe pas", async () => {
    mockRepository.findById.mockResolvedValue(null);

    await expect(service.getOrderById("client-1", "order-1")).rejects.toThrow(
      NotFoundError,
    );
  });

  it("ForbiddenError si la commande appartient à un autre client", async () => {
    mockRepository.findById.mockResolvedValue({
      id: "order-1",
      clientId: "client-AUTRE",
    });

    await expect(service.getOrderById("client-1", "order-1")).rejects.toThrow(
      ForbiddenError,
    );
  });

  it("retourne la commande si elle appartient bien au client", async () => {
    const order = { id: "order-1", clientId: "client-1" };
    mockRepository.findById.mockResolvedValue(order);

    const result = await service.getOrderById("client-1", "order-1");

    expect(result).toBe(order);
  });
});

// ── handlePaymentFailureOrExpiry ─────────────────────────────────────────────

describe("OrderService.handlePaymentFailureOrExpiry", () => {
  it("délègue au repository pour annuler et restaurer le stock", async () => {
    await service.handlePaymentFailureOrExpiry("sess_123");

    expect(mockRepository.cancelByStripeSession).toHaveBeenCalledWith(
      "sess_123",
    );
  });
});

// ── Côté secrétaire ────────────────────────────────────────────────────────

describe("OrderService.markOrderReady", () => {
  it("BadRequestError si aucun profil secrétaire", async () => {
    mockPrisma.secretaryProfile.findUnique.mockResolvedValue(null);

    await expect(
      service.markOrderReady("secretary-1", "order-1"),
    ).rejects.toThrow(BadRequestError);
  });

  it("BadRequestError si le repository refuse la transition (commande absente/mauvaise clinique/pas CONFIRMED)", async () => {
    mockPrisma.secretaryProfile.findUnique.mockResolvedValue({
      clinicId: "clinic-1",
    });
    mockRepository.markReady.mockResolvedValue(false);

    await expect(
      service.markOrderReady("secretary-1", "order-1"),
    ).rejects.toThrow(BadRequestError);
  });

  it("envoie l'email 'commande prête' avec les infos complètes de la clinique", async () => {
    mockPrisma.secretaryProfile.findUnique.mockResolvedValue({
      clinicId: "clinic-1",
    });
    mockRepository.markReady.mockResolvedValue(true);
    mockRepository.findById.mockResolvedValue({
      id: "order-1",
      clientId: "client-1",
      pickupCode: "ABC123",
      orderItems: [
        {
          quantity: 1,
          unitPrice: 30,
          productClinic: { product: { name: "Hill's Renal" } },
        },
      ],
    });
    mockPrisma.clientProfile.findUnique.mockResolvedValue({
      user: { firstname: "Bob", email: "bob@c.fr" },
    });
    mockPrisma.clinic.findUnique.mockResolvedValue({
      name: "Clinique du Parc",
      address: "1 rue Test",
      phone: "0102030405",
      openingHours: "9h-18h",
    });

    await service.markOrderReady("secretary-1", "order-1");

    expect(mockEmailService.sendOrderReady).toHaveBeenCalledWith(
      "bob@c.fr",
      "Bob",
      expect.objectContaining({
        clinicName: "Clinique du Parc",
        clinicAddress: "1 rue Test",
        pickupCode: "ABC123",
        total: 30,
      }),
    );
  });

  it("n'envoie aucun email si la commande n'a pas (encore) de code de retrait", async () => {
    mockPrisma.secretaryProfile.findUnique.mockResolvedValue({
      clinicId: "clinic-1",
    });
    mockRepository.markReady.mockResolvedValue(true);
    mockRepository.findById.mockResolvedValue({
      id: "order-1",
      pickupCode: null,
    });

    await service.markOrderReady("secretary-1", "order-1");

    expect(mockEmailService.sendOrderReady).not.toHaveBeenCalled();
  });
});

describe("OrderService.deliverOrder", () => {
  it("NotFoundError si aucun code ne correspond", async () => {
    mockPrisma.secretaryProfile.findUnique.mockResolvedValue({
      clinicId: "clinic-1",
    });
    mockRepository.findByClinicAndPickupCode.mockResolvedValue(null);

    await expect(
      service.deliverOrder("secretary-1", "ZZZ999"),
    ).rejects.toThrow(NotFoundError);
  });

  it("marque la commande PICKED_UP quand le code correspond", async () => {
    mockPrisma.secretaryProfile.findUnique.mockResolvedValue({
      clinicId: "clinic-1",
    });
    mockRepository.findByClinicAndPickupCode.mockResolvedValue({
      id: "order-1",
    });
    mockRepository.markPickedUp.mockResolvedValue({
      id: "order-1",
      status: "PICKED_UP",
    });

    const result = await service.deliverOrder("secretary-1", "abc123");

    // Le code est normalisé en majuscules avant recherche
    expect(mockRepository.findByClinicAndPickupCode).toHaveBeenCalledWith(
      "clinic-1",
      "ABC123",
    );
    expect(mockRepository.markPickedUp).toHaveBeenCalledWith("order-1");
    expect(result.status).toBe("PICKED_UP");
  });
});