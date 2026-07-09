import { describe, it, expect, vi, beforeEach } from "vitest";
import { NotFoundError, ForbiddenError, BadRequestError } from "@api/errors";
import type { UserRole } from "@armali/schemas";

const mockPrisma = vi.hoisted(() => ({
  referentClinicProfile: { findUnique: vi.fn() },
  clinic: { findFirst: vi.fn() },
}));
vi.mock("@api/lib/prisma", () => ({ prisma: mockPrisma }));

const mockRepository = vi.hoisted(() => ({
  findAll: vi.fn(),
  findByClinic: vi.fn(),
  create: vi.fn(),
  findById: vi.fn(),
  approve: vi.fn(),
  reject: vi.fn(),
}));
vi.mock("../product-request.repository", () => ({
  ProductRequestRepository: vi.fn(function () {
    return mockRepository;
  }),
}));

const mockProductRepository = vi.hoisted(() => ({ create: vi.fn() }));
vi.mock("../../products/product.repository", () => ({
  ProductRepository: vi.fn(function () {
    return mockProductRepository;
  }),
}));

const mockBrandRepository = vi.hoisted(() => ({
  findByExactName: vi.fn(),
  create: vi.fn(),
}));
vi.mock("../../brands/brand.repository", () => ({
  BrandRepository: vi.fn(function () {
    return mockBrandRepository;
  }),
}));

const { ProductRequestRepository } = await import(
  "../product-request.repository"
);
const { ProductRepository } = await import("../../products/product.repository");
const { BrandRepository } = await import("../../brands/brand.repository");
const { ProductRequestService } = await import("../product-request.service");

const service = new ProductRequestService(
  new ProductRequestRepository({} as any),
  new ProductRepository({} as any),
  new BrandRepository({} as any),
);

beforeEach(() => vi.clearAllMocks());

const FORBIDDEN_REQUESTER_ROLES: UserRole[] = [
  "ADMIN",
  "SECRETARY",
  "VETERINARIAN",
  "CLIENT",
];

// ── getAll (admin only) ──────────────────────────────────────────────────────

describe("ProductRequestService.getAll", () => {
  it.each<UserRole>(["DIRECTOR", "REFERENT", "SECRETARY", "CLIENT", "VETERINARIAN"])(
    "%s — ForbiddenError, réservé à ADMIN",
    async (role) => {
      await expect(service.getAll(undefined, role)).rejects.toThrow(
        ForbiddenError,
      );
    },
  );

  it("ADMIN — délègue au repository avec le filtre de statut", async () => {
    mockRepository.findAll.mockResolvedValue([{ id: "req-1" }]);

    const result = await service.getAll("PENDING", "ADMIN");

    expect(mockRepository.findAll).toHaveBeenCalledWith("PENDING");
    expect(result).toHaveLength(1);
  });
});

// ── getMine / résolution de clinique ─────────────────────────────────────────

describe("ProductRequestService.getMine", () => {
  it.each(FORBIDDEN_REQUESTER_ROLES)(
    "%s — ForbiddenError, réservé au référent/directeur",
    async (role) => {
      await expect(service.getMine("user-1", role)).rejects.toThrow(
        ForbiddenError,
      );
    },
  );

  it("BadRequestError si aucune clinique associée (ni référent ni directeur)", async () => {
    mockPrisma.referentClinicProfile.findUnique.mockResolvedValue(null);
    mockPrisma.clinic.findFirst.mockResolvedValue(null);

    await expect(service.getMine("user-1", "REFERENT")).rejects.toThrow(
      BadRequestError,
    );
  });

  it("REFERENT — résout la clinique via ReferentClinicProfile", async () => {
    mockPrisma.referentClinicProfile.findUnique.mockResolvedValue({
      clinicId: "clinic-1",
    });
    mockPrisma.clinic.findFirst.mockResolvedValue(null);
    mockRepository.findByClinic.mockResolvedValue([]);

    await service.getMine("user-1", "REFERENT");

    expect(mockRepository.findByClinic).toHaveBeenCalledWith("clinic-1");
  });

  it("DIRECTOR — résout la clinique via Clinic.directorId (pas de clinicId direct sur le profil)", async () => {
    mockPrisma.referentClinicProfile.findUnique.mockResolvedValue(null);
    mockPrisma.clinic.findFirst.mockResolvedValue({ id: "clinic-2" });
    mockRepository.findByClinic.mockResolvedValue([]);

    await service.getMine("user-1", "DIRECTOR");

    expect(mockRepository.findByClinic).toHaveBeenCalledWith("clinic-2");
  });
});

// ── create ───────────────────────────────────────────────────────────────────

describe("ProductRequestService.create", () => {
  const data = { name: "Croquettes X", newBrandName: "MarqueX" } as any;

  it.each(FORBIDDEN_REQUESTER_ROLES)(
    "%s — ForbiddenError avant toute résolution de clinique",
    async (role) => {
      await expect(service.create("user-1", role, data)).rejects.toThrow(
        ForbiddenError,
      );
      expect(mockPrisma.referentClinicProfile.findUnique).not.toHaveBeenCalled();
    },
  );

  it("REFERENT — crée la demande rattachée à sa clinique", async () => {
    mockPrisma.referentClinicProfile.findUnique.mockResolvedValue({
      clinicId: "clinic-1",
    });
    mockRepository.create.mockResolvedValue({ id: "req-1", ...data });

    const result = await service.create("user-1", "REFERENT", data);

    expect(mockRepository.create).toHaveBeenCalledWith(
      data,
      "user-1",
      "clinic-1",
    );
    expect(result.id).toBe("req-1");
  });
});

// ── approve ──────────────────────────────────────────────────────────────────

describe("ProductRequestService.approve", () => {
  it.each<UserRole>(["DIRECTOR", "REFERENT", "SECRETARY", "CLIENT", "VETERINARIAN"])(
    "%s — ForbiddenError, réservé à ADMIN",
    async (role) => {
      await expect(service.approve("req-1", "admin-1", role)).rejects.toThrow(
        ForbiddenError,
      );
      expect(mockRepository.findById).not.toHaveBeenCalled();
    },
  );

  it("NotFoundError si la demande n'existe pas", async () => {
    mockRepository.findById.mockResolvedValue(null);

    await expect(
      service.approve("unknown", "admin-1", "ADMIN"),
    ).rejects.toThrow(NotFoundError);
  });

  it("BadRequestError si la demande a déjà été traitée", async () => {
    mockRepository.findById.mockResolvedValue({
      id: "req-1",
      status: "APPROVED",
    });

    await expect(
      service.approve("req-1", "admin-1", "ADMIN"),
    ).rejects.toThrow(BadRequestError);
  });

  it("réutilise une marque existante si le nom correspond exactement", async () => {
    mockRepository.findById.mockResolvedValue({
      id: "req-1",
      status: "PENDING",
      brandId: null,
      newBrandName: "Royal Canin",
      name: "Croquettes",
      description: null,
      picture: null,
      websiteUrl: null,
    });
    mockBrandRepository.findByExactName.mockResolvedValue({
      id: "brand-existing",
      name: "Royal Canin",
    });
    mockProductRepository.create.mockResolvedValue({ id: "product-1" });
    mockRepository.approve.mockResolvedValue({ id: "req-1", status: "APPROVED" });

    await service.approve("req-1", "admin-1", "ADMIN");

    expect(mockBrandRepository.create).not.toHaveBeenCalled();
    expect(mockProductRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ brandId: "brand-existing" }),
    );
  });

  it("crée une nouvelle marque si aucun nom exact ne correspond", async () => {
    mockRepository.findById.mockResolvedValue({
      id: "req-1",
      status: "PENDING",
      brandId: null,
      newBrandName: "Marque Inédite",
      name: "Croquettes",
      description: null,
      picture: null,
      websiteUrl: null,
    });
    mockBrandRepository.findByExactName.mockResolvedValue(null);
    mockBrandRepository.create.mockResolvedValue({ id: "brand-new" });
    mockProductRepository.create.mockResolvedValue({ id: "product-1" });
    mockRepository.approve.mockResolvedValue({ id: "req-1", status: "APPROVED" });

    await service.approve("req-1", "admin-1", "ADMIN");

    expect(mockBrandRepository.create).toHaveBeenCalledWith({
      name: "Marque Inédite",
    });
    expect(mockProductRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ brandId: "brand-new" }),
    );
  });

  it("utilise directement brandId si déjà fourni (pas de newBrandName)", async () => {
    mockRepository.findById.mockResolvedValue({
      id: "req-1",
      status: "PENDING",
      brandId: "brand-fourni",
      newBrandName: null,
      name: "Croquettes",
      description: null,
      picture: null,
      websiteUrl: null,
    });
    mockProductRepository.create.mockResolvedValue({ id: "product-1" });
    mockRepository.approve.mockResolvedValue({ id: "req-1", status: "APPROVED" });

    await service.approve("req-1", "admin-1", "ADMIN");

    expect(mockBrandRepository.findByExactName).not.toHaveBeenCalled();
    expect(mockProductRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ brandId: "brand-fourni" }),
    );
  });

  it("BadRequestError si ni brandId ni newBrandName ne permettent de résoudre une marque", async () => {
    mockRepository.findById.mockResolvedValue({
      id: "req-1",
      status: "PENDING",
      brandId: null,
      newBrandName: null,
      name: "Croquettes",
    });

    await expect(
      service.approve("req-1", "admin-1", "ADMIN"),
    ).rejects.toThrow(BadRequestError);
    expect(mockProductRepository.create).not.toHaveBeenCalled();
  });

  it("crée le produit puis approuve la demande en la liant au produit créé", async () => {
    mockRepository.findById.mockResolvedValue({
      id: "req-1",
      status: "PENDING",
      brandId: "brand-1",
      newBrandName: null,
      name: "Croquettes",
      description: "Description",
      picture: null,
      websiteUrl: null,
    });
    mockProductRepository.create.mockResolvedValue({ id: "product-1" });
    mockRepository.approve.mockResolvedValue({
      id: "req-1",
      status: "APPROVED",
      createdProductId: "product-1",
    });

    const result = await service.approve("req-1", "admin-1", "ADMIN");

    expect(mockRepository.approve).toHaveBeenCalledWith(
      "req-1",
      "product-1",
      "admin-1",
    );
    expect(result.status).toBe("APPROVED");
  });
});

// ── reject ───────────────────────────────────────────────────────────────────

describe("ProductRequestService.reject", () => {
  const data = { rejectionReason: "Produit déjà au catalogue" } as any;

  it.each<UserRole>(["DIRECTOR", "REFERENT", "SECRETARY", "CLIENT", "VETERINARIAN"])(
    "%s — ForbiddenError, réservé à ADMIN",
    async (role) => {
      await expect(
        service.reject("req-1", "admin-1", role, data),
      ).rejects.toThrow(ForbiddenError);
      expect(mockRepository.findById).not.toHaveBeenCalled();
    },
  );

  it("NotFoundError si la demande n'existe pas", async () => {
    mockRepository.findById.mockResolvedValue(null);

    await expect(
      service.reject("unknown", "admin-1", "ADMIN", data),
    ).rejects.toThrow(NotFoundError);
  });

  it("BadRequestError si la demande a déjà été traitée", async () => {
    mockRepository.findById.mockResolvedValue({
      id: "req-1",
      status: "REJECTED",
    });

    await expect(
      service.reject("req-1", "admin-1", "ADMIN", data),
    ).rejects.toThrow(BadRequestError);
  });

  it("ADMIN — rejette la demande avec le motif fourni", async () => {
    mockRepository.findById.mockResolvedValue({
      id: "req-1",
      status: "PENDING",
    });
    mockRepository.reject.mockResolvedValue({
      id: "req-1",
      status: "REJECTED",
      rejectionReason: data.rejectionReason,
    });

    const result = await service.reject("req-1", "admin-1", "ADMIN", data);

    expect(mockRepository.reject).toHaveBeenCalledWith(
      "req-1",
      "admin-1",
      data.rejectionReason,
    );
    expect(result.status).toBe("REJECTED");
  });
});