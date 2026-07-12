import { describe, it, expect, vi, beforeEach } from "vitest";
import { BadRequestError, ForbiddenError, NotFoundError } from "@api/errors";

const mockRepository = vi.hoisted(() => ({
  create: vi.fn(),
  findByClinic: vi.fn(),
  findById: vi.fn(),
  markReceived: vi.fn(),
  markCancelled: vi.fn(),
}));
const mockSupplierRepository = vi.hoisted(() => ({ findById: vi.fn() }));
const mockBudgetRepository = vi.hoisted(() => ({
  getBalance: vi.fn(),
  create: vi.fn(),
}));
const mockClinicService = vi.hoisted(() => ({ getClinicIdByUserId: vi.fn() }));
const mockProductClinicRepository = vi.hoisted(() => ({
  findByClinicAndProduct: vi.fn(),
  incrementStock: vi.fn(),
  create: vi.fn(),
}));

const { SupplierOrderService } = await import("../supplier-order.service");

const service = new SupplierOrderService(
  mockRepository as any,
  mockSupplierRepository as any,
  mockBudgetRepository as any,
  mockClinicService as any,
  mockProductClinicRepository as any,
);

beforeEach(() => vi.clearAllMocks());

const makeSupplier = (overrides = {}) => ({
  id: "supplier-1",
  name: "Zoetis France",
  supplierProducts: [{ productId: "product-1", costPrice: 12.5 }],
  ...overrides,
});

const makeOrder = (overrides = {}) => ({
  id: "order-1",
  clinicId: "clinic-1",
  status: "PENDING",
  createdAt: new Date("2026-01-01T10:00:00Z"),
  receivedAt: null,
  supplier: { name: "Zoetis France" },
  items: [{ productId: "product-1", quantity: 10, unitCost: 12.5 }],
  ...overrides,
});

// ── create ───────────────────────────────────────────────────────────────────

describe("SupplierOrderService.create", () => {
  const data = {
    supplierId: "supplier-1",
    items: [{ productId: "product-1", quantity: 10 }],
  } as any;

  beforeEach(() => {
    mockClinicService.getClinicIdByUserId.mockResolvedValue("clinic-1");
  });

  it("ForbiddenError si le fournisseur n'existe pas", async () => {
    mockSupplierRepository.findById.mockResolvedValue(null);
    await expect(service.create("user-1" as any, "REFERENT", data)).rejects.toThrow(
      ForbiddenError,
    );
  });

  it("BadRequestError si un produit n'est pas au catalogue du fournisseur", async () => {
    mockSupplierRepository.findById.mockResolvedValue(
      makeSupplier({ supplierProducts: [] }),
    );
    await expect(service.create("user-1" as any, "REFERENT", data)).rejects.toThrow(
      BadRequestError,
    );
  });

  it("BadRequestError si le budget est insuffisant", async () => {
    mockSupplierRepository.findById.mockResolvedValue(makeSupplier());
    mockBudgetRepository.getBalance.mockResolvedValue(50);
    await expect(service.create("user-1" as any, "REFERENT", data)).rejects.toThrow(
      BadRequestError,
    );
    expect(mockRepository.create).not.toHaveBeenCalled();
  });

  it("crée la commande et débite exactement le total du budget", async () => {
    mockSupplierRepository.findById.mockResolvedValue(makeSupplier());
    mockBudgetRepository.getBalance.mockResolvedValue(500);
    mockRepository.create.mockResolvedValue(makeOrder());

    const result = await service.create("user-1" as any, "REFERENT", data);

    expect(mockRepository.create).toHaveBeenCalledWith(
      "clinic-1",
      "supplier-1",
      "user-1",
      [{ productId: "product-1", quantity: 10, unitCost: 12.5 }],
    );
    expect(mockBudgetRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        clinicId: "clinic-1",
        type: "DEBIT",
        amount: 125,
        supplierOrderId: "order-1",
      }),
    );
    expect(result.total).toBe(125);
  });
});

// ── markReceived ─────────────────────────────────────────────────────────────

describe("SupplierOrderService.markReceived", () => {
  beforeEach(() => {
    mockClinicService.getClinicIdByUserId.mockResolvedValue("clinic-1");
  });

  it("NotFoundError si la commande n'existe pas", async () => {
    mockRepository.findById.mockResolvedValue(null);
    await expect(
      service.markReceived("user-1" as any, "REFERENT", "unknown"),
    ).rejects.toThrow(NotFoundError);
  });

  it("ForbiddenError si la commande appartient à une autre clinique", async () => {
    mockRepository.findById.mockResolvedValue(
      makeOrder({ clinicId: "clinic-AUTRE" }),
    );
    await expect(
      service.markReceived("user-1" as any, "REFERENT", "order-1"),
    ).rejects.toThrow(ForbiddenError);
  });

  it("BadRequestError si la commande n'est plus PENDING", async () => {
    mockRepository.findById.mockResolvedValue(makeOrder({ status: "RECEIVED" }));
    await expect(
      service.markReceived("user-1" as any, "REFERENT", "order-1"),
    ).rejects.toThrow(BadRequestError);
  });

  it("incrémente le stock existant du ClinicProduct pour chaque ligne", async () => {
    mockRepository.findById.mockResolvedValue(makeOrder());
    mockProductClinicRepository.findByClinicAndProduct.mockResolvedValue({
      id: "cp-1",
      stock: 5,
    });
    mockRepository.markReceived.mockResolvedValue(makeOrder({ status: "RECEIVED" }));

    await service.markReceived("user-1" as any, "REFERENT", "order-1");

    expect(mockProductClinicRepository.incrementStock).toHaveBeenCalledWith(
      "cp-1",
      10,
    );
    expect(mockProductClinicRepository.create).not.toHaveBeenCalled();
  });

  it("crée le ClinicProduct si le produit n'était pas encore dans la boutique", async () => {
    mockRepository.findById.mockResolvedValue(makeOrder());
    mockProductClinicRepository.findByClinicAndProduct.mockResolvedValue(null);
    mockRepository.markReceived.mockResolvedValue(makeOrder({ status: "RECEIVED" }));

    await service.markReceived("user-1" as any, "REFERENT", "order-1");

    expect(mockProductClinicRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        clinicId: "clinic-1",
        productId: "product-1",
        stock: 10,
      }),
    );
  });

  it("passe le statut à RECEIVED", async () => {
    mockRepository.findById.mockResolvedValue(makeOrder());
    mockProductClinicRepository.findByClinicAndProduct.mockResolvedValue({ id: "cp-1" });
    mockRepository.markReceived.mockResolvedValue(makeOrder({ status: "RECEIVED" }));

    const result = await service.markReceived("user-1" as any, "REFERENT", "order-1");

    expect(result.status).toBe("RECEIVED");
  });
});

// ── cancel ───────────────────────────────────────────────────────────────────

describe("SupplierOrderService.cancel", () => {
  beforeEach(() => {
    mockClinicService.getClinicIdByUserId.mockResolvedValue("clinic-1");
  });

  it("BadRequestError si la commande n'est plus PENDING", async () => {
    mockRepository.findById.mockResolvedValue(makeOrder({ status: "RECEIVED" }));
    await expect(
      service.cancel("user-1" as any, "REFERENT", "order-1"),
    ).rejects.toThrow(BadRequestError);
  });

  it("rembourse intégralement le budget et passe la commande à CANCELLED", async () => {
    mockRepository.findById.mockResolvedValue(makeOrder());
    mockRepository.markCancelled.mockResolvedValue(makeOrder({ status: "CANCELLED" }));

    const result = await service.cancel("user-1" as any, "REFERENT", "order-1");

    expect(mockBudgetRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        clinicId: "clinic-1",
        type: "REFUND",
        amount: 125,
        supplierOrderId: "order-1",
      }),
    );
    expect(result.status).toBe("CANCELLED");
  });
});