import { describe, it, expect, vi, beforeEach } from "vitest";
import { ForbiddenError, NotFoundError } from "@api/errors";
import type { UserRole } from "@armali/schemas";

const mockSupplierRepository = vi.hoisted(() => ({
  findAll: vi.fn(),
  findById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
}));
const mockSupplierProductRepository = vi.hoisted(() => ({
  findById: vi.fn(),
  upsert: vi.fn(),
  updateCost: vi.fn(),
  delete: vi.fn(),
}));

const { SupplierService } = await import("../supplier.service");

const service = new SupplierService(
  mockSupplierRepository as any,
  mockSupplierProductRepository as any,
);

beforeEach(() => vi.clearAllMocks());

const READ_FORBIDDEN_ROLES: UserRole[] = [
  "SECRETARY",
  "VETERINARIAN",
  "CLIENT",
];
const WRITE_FORBIDDEN_ROLES: UserRole[] = [
  "REFERENT",
  "DIRECTOR",
  "SECRETARY",
  "VETERINARIAN",
  "CLIENT",
];

const makeSupplier = (overrides = {}) => ({
  id: "supplier-1",
  name: "Zoetis France",
  supplierProducts: [],
  ...overrides,
});

// ── Lecture : admin/référent/directeur ───────────────────────────────────────

describe("SupplierService.getAll", () => {
  it.each(READ_FORBIDDEN_ROLES)("%s — ForbiddenError", async (role) => {
    await expect(service.getAll(role)).rejects.toThrow(ForbiddenError);
  });

  it.each<UserRole>(["ADMIN", "REFERENT", "DIRECTOR"])(
    "%s — délègue au repository",
    async (role) => {
      mockSupplierRepository.findAll.mockResolvedValue([makeSupplier()]);
      const result = await service.getAll(role);
      expect(result).toHaveLength(1);
    },
  );
});

describe("SupplierService.getById", () => {
  it.each(READ_FORBIDDEN_ROLES)("%s — ForbiddenError", async (role) => {
    await expect(service.getById(role, "supplier-1")).rejects.toThrow(
      ForbiddenError,
    );
  });

  it("NotFoundError si absent", async () => {
    mockSupplierRepository.findById.mockResolvedValue(null);
    await expect(service.getById("REFERENT", "unknown")).rejects.toThrow(
      NotFoundError,
    );
  });

  it("retourne le fournisseur trouvé", async () => {
    mockSupplierRepository.findById.mockResolvedValue(makeSupplier());
    const result = await service.getById("DIRECTOR", "supplier-1");
    expect(result.id).toBe("supplier-1");
  });
});

// ── Écriture Supplier : admin uniquement ─────────────────────────────────────

describe("SupplierService.create", () => {
  const data = { name: "Virbac" } as any;

  it.each(WRITE_FORBIDDEN_ROLES)(
    "%s — ForbiddenError, catalogue admin-only",
    async (role) => {
      await expect(service.create(role, data)).rejects.toThrow(ForbiddenError);
      expect(mockSupplierRepository.create).not.toHaveBeenCalled();
    },
  );

  it("ADMIN — crée le fournisseur", async () => {
    mockSupplierRepository.create.mockResolvedValue(
      makeSupplier({ name: "Virbac" }),
    );
    const result = await service.create("ADMIN", data);
    expect(mockSupplierRepository.create).toHaveBeenCalledWith(data);
    expect(result.name).toBe("Virbac");
  });
});

describe("SupplierService.update / delete", () => {
  it.each(WRITE_FORBIDDEN_ROLES)(
    "%s — update — ForbiddenError avant toute lecture",
    async (role) => {
      await expect(
        service.update(role, "supplier-1", { name: "X" } as any),
      ).rejects.toThrow(ForbiddenError);
      expect(mockSupplierRepository.findById).not.toHaveBeenCalled();
    },
  );

  it("ADMIN — update — NotFoundError si absent", async () => {
    mockSupplierRepository.findById.mockResolvedValue(null);
    await expect(
      service.update("ADMIN", "unknown", { name: "X" } as any),
    ).rejects.toThrow(NotFoundError);
  });

  it("ADMIN — update — modifie le fournisseur", async () => {
    mockSupplierRepository.findById.mockResolvedValue(makeSupplier());
    mockSupplierRepository.update.mockResolvedValue(
      makeSupplier({ name: "Nouveau" }),
    );
    const result = await service.update("ADMIN", "supplier-1", {
      name: "Nouveau",
    } as any);
    expect(result.name).toBe("Nouveau");
  });

  it.each(WRITE_FORBIDDEN_ROLES)(
    "%s — delete — ForbiddenError avant toute lecture",
    async (role) => {
      await expect(service.delete(role, "supplier-1")).rejects.toThrow(
        ForbiddenError,
      );
      expect(mockSupplierRepository.findById).not.toHaveBeenCalled();
    },
  );

  it("ADMIN — delete — NotFoundError si absent", async () => {
    mockSupplierRepository.findById.mockResolvedValue(null);
    await expect(service.delete("ADMIN", "unknown")).rejects.toThrow(
      NotFoundError,
    );
  });

  it("ADMIN — delete — supprime le fournisseur", async () => {
    mockSupplierRepository.findById.mockResolvedValue(makeSupplier());
    mockSupplierRepository.delete.mockResolvedValue(undefined);
    await service.delete("ADMIN", "supplier-1");
    expect(mockSupplierRepository.delete).toHaveBeenCalledWith("supplier-1");
  });
});

// ── Catalogue de prix d'achat (SupplierProduct) ──────────────────────────────

describe("SupplierService.addProduct", () => {
  const data = { productId: "product-1", costPrice: 12.5 } as any;

  it.each(WRITE_FORBIDDEN_ROLES)("%s — ForbiddenError", async (role) => {
    await expect(service.addProduct(role, "supplier-1", data)).rejects.toThrow(
      ForbiddenError,
    );
  });

  it("ADMIN — NotFoundError si le fournisseur n'existe pas", async () => {
    mockSupplierRepository.findById.mockResolvedValue(null);
    await expect(service.addProduct("ADMIN", "unknown", data)).rejects.toThrow(
      NotFoundError,
    );
  });

  it("ADMIN — ajoute le produit au catalogue (upsert)", async () => {
    mockSupplierRepository.findById.mockResolvedValue(makeSupplier());
    mockSupplierProductRepository.upsert.mockResolvedValue({ id: "sp-1" });
    await service.addProduct("ADMIN", "supplier-1", data);
    expect(mockSupplierProductRepository.upsert).toHaveBeenCalledWith(
      "supplier-1",
      "product-1",
      12.5,
    );
  });
});

describe("SupplierService.updateProduct / removeProduct", () => {
  it("ADMIN — NotFoundError si le lien n'appartient pas à ce fournisseur", async () => {
    mockSupplierProductRepository.findById.mockResolvedValue({
      id: "sp-1",
      supplierId: "supplier-AUTRE",
    });
    await expect(
      service.updateProduct("ADMIN", "supplier-1", "sp-1", {
        costPrice: 10,
      } as any),
    ).rejects.toThrow(NotFoundError);
  });

  it("ADMIN — met à jour le prix d'achat", async () => {
    mockSupplierProductRepository.findById.mockResolvedValue({
      id: "sp-1",
      supplierId: "supplier-1",
    });
    mockSupplierProductRepository.updateCost.mockResolvedValue({
      id: "sp-1",
      costPrice: 15,
    });
    const result = await service.updateProduct("ADMIN", "supplier-1", "sp-1", {
      costPrice: 15,
    } as any);
    expect(result.costPrice).toBe(15);
  });

  it("ADMIN — retire le produit du catalogue", async () => {
    mockSupplierProductRepository.findById.mockResolvedValue({
      id: "sp-1",
      supplierId: "supplier-1",
    });
    mockSupplierProductRepository.delete.mockResolvedValue(undefined);
    await service.removeProduct("ADMIN", "supplier-1", "sp-1");
    expect(mockSupplierProductRepository.delete).toHaveBeenCalledWith("sp-1");
  });
});
