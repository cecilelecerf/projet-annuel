import { describe, it, expect, vi, beforeEach } from "vitest";
import { NotFoundError, ForbiddenError } from "@api/errors";
import type { UserRole } from "@armali/schemas";

const mockRepository = vi.hoisted(() => ({
  findAll: vi.fn(),
  findById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
}));
vi.mock("../product.repository", () => ({
  ProductRepository: vi.fn(function () {
    return mockRepository;
  }),
}));

const mockClinicRepository = vi.hoisted(() => ({
  findByClinic: vi.fn(),
  findById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  incrementStock: vi.fn(),
  delete: vi.fn(),
}));
vi.mock("../product-clinic.repository", () => ({
  ProductClinicRepository: vi.fn(function () {
    return mockClinicRepository;
  }),
}));

const { ProductRepository } = await import("../product.repository");
const { ProductClinicRepository } = await import(
  "../product-clinic.repository"
);
const { ProductService } = await import("../product.service");

const service = new ProductService(
  new ProductRepository({} as any),
  new ProductClinicRepository({} as any),
);

beforeEach(() => vi.clearAllMocks());

const CATALOG_FORBIDDEN_ROLES: UserRole[] = [
  "DIRECTOR",
  "REFERENT",
  "SECRETARY",
  "VETERINARIAN",
  "CLIENT",
];
const STOCK_FORBIDDEN_ROLES: UserRole[] = [
  "SECRETARY",
  "VETERINARIAN",
  "CLIENT",
];

const makeProduct = (overrides = {}) => ({
  id: "product-1",
  name: "Croquettes",
  brandId: "brand-1",
  qrCode: "qr-1",
  ...overrides,
});

const makeClinicProduct = (overrides = {}) => ({
  id: "cp-1",
  clinicId: "clinic-1",
  productId: "product-1",
  stock: 10,
  minimumRequired: 5,
  price: 20,
  ...overrides,
});

// ── Catalogue global (Product) ─────────────────────────────────────────────

describe("ProductService.getAll / getById", () => {
  it("getAll délègue au repository", async () => {
    mockRepository.findAll.mockResolvedValue([makeProduct()]);
    const result = await service.getAll();
    expect(result).toHaveLength(1);
  });

  it("getById — NotFoundError si absent", async () => {
    mockRepository.findById.mockResolvedValue(null);
    await expect(service.getById("unknown")).rejects.toThrow(NotFoundError);
  });

  it("getById — retourne le produit trouvé", async () => {
    mockRepository.findById.mockResolvedValue(makeProduct());
    const result = await service.getById("product-1");
    expect(result.id).toBe("product-1");
  });
});

describe("ProductService.create", () => {
  const data = { name: "Nouveau", brandId: "brand-1" } as any;

  it.each(CATALOG_FORBIDDEN_ROLES)(
    "%s — ForbiddenError, catalogue réservé à ADMIN",
    async (role) => {
      await expect(service.create(data, role)).rejects.toThrow(
        ForbiddenError,
      );
      expect(mockRepository.create).not.toHaveBeenCalled();
    },
  );

  it("ADMIN — crée le produit", async () => {
    mockRepository.create.mockResolvedValue(makeProduct());
    const result = await service.create(data, "ADMIN");
    expect(mockRepository.create).toHaveBeenCalledWith(data);
    expect(result.id).toBe("product-1");
  });
});

describe("ProductService.update", () => {
  const data = { name: "Modifié" } as any;

  it.each(CATALOG_FORBIDDEN_ROLES)(
    "%s — ForbiddenError avant toute lecture",
    async (role) => {
      await expect(service.update("product-1", data, role)).rejects.toThrow(
        ForbiddenError,
      );
      expect(mockRepository.findById).not.toHaveBeenCalled();
    },
  );

  it("ADMIN — NotFoundError si le produit n'existe pas", async () => {
    mockRepository.findById.mockResolvedValue(null);
    await expect(
      service.update("unknown", data, "ADMIN"),
    ).rejects.toThrow(NotFoundError);
    expect(mockRepository.update).not.toHaveBeenCalled();
  });

  it("ADMIN — met à jour le produit", async () => {
    mockRepository.findById.mockResolvedValue(makeProduct());
    mockRepository.update.mockResolvedValue(makeProduct({ name: "Modifié" }));
    const result = await service.update("product-1", data, "ADMIN");
    expect(mockRepository.update).toHaveBeenCalledWith("product-1", data);
    expect(result.name).toBe("Modifié");
  });
});

describe("ProductService.delete", () => {
  it.each(CATALOG_FORBIDDEN_ROLES)(
    "%s — ForbiddenError avant toute lecture",
    async (role) => {
      await expect(service.delete("product-1", role)).rejects.toThrow(
        ForbiddenError,
      );
      expect(mockRepository.findById).not.toHaveBeenCalled();
    },
  );

  it("ADMIN — NotFoundError si le produit n'existe pas", async () => {
    mockRepository.findById.mockResolvedValue(null);
    await expect(service.delete("unknown", "ADMIN")).rejects.toThrow(
      NotFoundError,
    );
  });

  it("ADMIN — supprime le produit", async () => {
    mockRepository.findById.mockResolvedValue(makeProduct());
    mockRepository.delete.mockResolvedValue(undefined);
    await service.delete("product-1", "ADMIN");
    expect(mockRepository.delete).toHaveBeenCalledWith("product-1");
  });
});

// ── Stock par clinique (ClinicProduct) ──────────────────────────────────────

describe("ProductService.getClinicProducts / getLowStockProducts", () => {
  it("getClinicProducts délègue au repository", async () => {
    mockClinicRepository.findByClinic.mockResolvedValue([makeClinicProduct()]);
    const result = await service.getClinicProducts("clinic-1");
    expect(result).toHaveLength(1);
  });

  it("getLowStockProducts ne garde que stock <= minimumRequired", async () => {
    mockClinicRepository.findByClinic.mockResolvedValue([
      makeClinicProduct({ id: "cp-1", stock: 2, minimumRequired: 5 }), // bas
      makeClinicProduct({ id: "cp-2", stock: 5, minimumRequired: 5 }), // égal, compte
      makeClinicProduct({ id: "cp-3", stock: 20, minimumRequired: 5 }), // au-dessus
    ]);

    const result = await service.getLowStockProducts("clinic-1");

    expect(result).toHaveLength(2);
    expect(result.map((p) => p.id)).toEqual(["cp-1", "cp-2"]);
  });
});

describe("ProductService.getClinicProductById", () => {
  it("NotFoundError si absent", async () => {
    mockClinicRepository.findById.mockResolvedValue(null);
    await expect(service.getClinicProductById("unknown")).rejects.toThrow(
      NotFoundError,
    );
  });

  it("retourne le produit clinique trouvé", async () => {
    mockClinicRepository.findById.mockResolvedValue(makeClinicProduct());
    const result = await service.getClinicProductById("cp-1");
    expect(result.id).toBe("cp-1");
  });
});

describe("ProductService.createClinicProduct", () => {
  const data = { clinicId: "clinic-1", productId: "product-1" } as any;

  it.each(STOCK_FORBIDDEN_ROLES)(
    "%s — ForbiddenError, gestion du stock réservée admin/directeur/référent",
    async (role) => {
      await expect(service.createClinicProduct(data, role)).rejects.toThrow(
        ForbiddenError,
      );
      expect(mockClinicRepository.create).not.toHaveBeenCalled();
    },
  );

  it.each<UserRole>(["ADMIN", "DIRECTOR", "REFERENT"])(
    "%s — crée le produit clinique",
    async (role) => {
      mockClinicRepository.create.mockResolvedValue(makeClinicProduct());
      const result = await service.createClinicProduct(data, role);
      expect(mockClinicRepository.create).toHaveBeenCalledWith(data);
      expect(result.id).toBe("cp-1");
    },
  );
});

describe("ProductService.updateClinicProduct", () => {
  const data = { minimumRequired: 8 } as any;

  it.each(STOCK_FORBIDDEN_ROLES)(
    "%s — ForbiddenError avant toute lecture",
    async (role) => {
      await expect(
        service.updateClinicProduct("cp-1", data, role),
      ).rejects.toThrow(ForbiddenError);
      expect(mockClinicRepository.findById).not.toHaveBeenCalled();
    },
  );

  it("REFERENT — NotFoundError si absent", async () => {
    mockClinicRepository.findById.mockResolvedValue(null);
    await expect(
      service.updateClinicProduct("unknown", data, "REFERENT"),
    ).rejects.toThrow(NotFoundError);
  });

  it("REFERENT — met à jour le produit clinique", async () => {
    mockClinicRepository.findById.mockResolvedValue(makeClinicProduct());
    mockClinicRepository.update.mockResolvedValue(
      makeClinicProduct({ minimumRequired: 8 }),
    );
    const result = await service.updateClinicProduct(
      "cp-1",
      data,
      "REFERENT",
    );
    expect(mockClinicRepository.update).toHaveBeenCalledWith("cp-1", data);
    expect(result.minimumRequired).toBe(8);
  });
});

describe("ProductService.restockClinicProduct", () => {
  const data = { quantity: 15 } as any;

  it.each(STOCK_FORBIDDEN_ROLES)(
    "%s — ForbiddenError avant toute lecture",
    async (role) => {
      await expect(
        service.restockClinicProduct("cp-1", data, role),
      ).rejects.toThrow(ForbiddenError);
      expect(mockClinicRepository.findById).not.toHaveBeenCalled();
    },
  );

  it("DIRECTOR — NotFoundError si absent", async () => {
    mockClinicRepository.findById.mockResolvedValue(null);
    await expect(
      service.restockClinicProduct("unknown", data, "DIRECTOR"),
    ).rejects.toThrow(NotFoundError);
    expect(mockClinicRepository.incrementStock).not.toHaveBeenCalled();
  });

  it("DIRECTOR — incrémente le stock de la quantité fournie", async () => {
    mockClinicRepository.findById.mockResolvedValue(makeClinicProduct());
    mockClinicRepository.incrementStock.mockResolvedValue(
      makeClinicProduct({ stock: 25 }),
    );
    const result = await service.restockClinicProduct(
      "cp-1",
      data,
      "DIRECTOR",
    );
    expect(mockClinicRepository.incrementStock).toHaveBeenCalledWith(
      "cp-1",
      15,
    );
    expect(result.stock).toBe(25);
  });
});

describe("ProductService.deleteClinicProduct", () => {
  it.each(STOCK_FORBIDDEN_ROLES)(
    "%s — ForbiddenError avant toute lecture",
    async (role) => {
      await expect(
        service.deleteClinicProduct("cp-1", role),
      ).rejects.toThrow(ForbiddenError);
      expect(mockClinicRepository.findById).not.toHaveBeenCalled();
    },
  );

  it("ADMIN — NotFoundError si absent", async () => {
    mockClinicRepository.findById.mockResolvedValue(null);
    await expect(
      service.deleteClinicProduct("unknown", "ADMIN"),
    ).rejects.toThrow(NotFoundError);
  });

  it("ADMIN — supprime le produit clinique", async () => {
    mockClinicRepository.findById.mockResolvedValue(makeClinicProduct());
    mockClinicRepository.delete.mockResolvedValue(undefined);
    await service.deleteClinicProduct("cp-1", "ADMIN");
    expect(mockClinicRepository.delete).toHaveBeenCalledWith("cp-1");
  });
});