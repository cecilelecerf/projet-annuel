import { describe, it, expect, vi, beforeEach } from "vitest";
import { NotFoundError, ForbiddenError } from "@api/errors";
import type { UserRole } from "@armali/schemas";

const mockRepository = vi.hoisted(() => ({
  findAll: vi.fn(),
  findById: vi.fn(),
  findByExactName: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
}));

vi.mock("../brand.repository", () => ({
  BrandRepository: vi.fn(function () {
    return mockRepository;
  }),
}));

const { BrandRepository } = await import("../brand.repository");
const { BrandService } = await import("../brand.service");

const service = new BrandService(new BrandRepository({} as any));

beforeEach(() => vi.clearAllMocks());

const ALLOWED_ROLES: UserRole[] = ["ADMIN"];
const FORBIDDEN_ROLES: UserRole[] = [
  "DIRECTOR",
  "REFERENT",
  "VETERINARIAN",
  "SECRETARY",
  "CLIENT",
];

const makeBrand = (overrides = {}) => ({
  id: "brand-1",
  name: "Royal Canin",
  logo: null,
  ...overrides,
});

// ── getAll / getById (lecture, aucune restriction de rôle) ────────────────

describe("BrandService.getAll", () => {
  it("délègue au repository, avec ou sans recherche", async () => {
    mockRepository.findAll.mockResolvedValue([makeBrand()]);

    const result = await service.getAll("royal");

    expect(mockRepository.findAll).toHaveBeenCalledWith("royal");
    expect(result).toHaveLength(1);
  });
});

describe("BrandService.getById", () => {
  it("retourne la marque trouvée", async () => {
    mockRepository.findById.mockResolvedValue(makeBrand());

    const result = await service.getById("brand-1");

    expect(result.id).toBe("brand-1");
  });

  it("lève NotFoundError si absente", async () => {
    mockRepository.findById.mockResolvedValue(null);

    await expect(service.getById("unknown")).rejects.toThrow(NotFoundError);
  });
});

// ── findOrCreate (admin-only, réutilise une marque existante par nom exact) ─

describe("BrandService.findOrCreate", () => {
  const data = { name: "Hill's" } as any;

  it.each(FORBIDDEN_ROLES)("%s — ForbiddenError, rien créé", async (role) => {
    await expect(service.findOrCreate(data, role)).rejects.toThrow(
      ForbiddenError,
    );
    expect(mockRepository.findByExactName).not.toHaveBeenCalled();
    expect(mockRepository.create).not.toHaveBeenCalled();
  });

  it("ADMIN — réutilise la marque existante si le nom correspond exactement", async () => {
    const existing = makeBrand({ name: "Hill's" });
    mockRepository.findByExactName.mockResolvedValue(existing);

    const result = await service.findOrCreate(data, "ADMIN");

    expect(mockRepository.create).not.toHaveBeenCalled();
    expect(result).toBe(existing);
  });

  it("ADMIN — crée la marque si aucun nom exact ne correspond", async () => {
    mockRepository.findByExactName.mockResolvedValue(null);
    mockRepository.create.mockResolvedValue(makeBrand({ name: "Hill's" }));

    const result = await service.findOrCreate(data, "ADMIN");

    expect(mockRepository.create).toHaveBeenCalledWith(data);
    expect(result.name).toBe("Hill's");
  });
});

// ── update ───────────────────────────────────────────────────────────────────

describe("BrandService.update", () => {
  const data = { name: "Nouveau nom" } as any;

  it.each(FORBIDDEN_ROLES)(
    "%s — ForbiddenError avant toute lecture",
    async (role) => {
      await expect(service.update("brand-1", data, role)).rejects.toThrow(
        ForbiddenError,
      );
      expect(mockRepository.findById).not.toHaveBeenCalled();
    },
  );

  it("marque introuvable — NotFoundError", async () => {
    mockRepository.findById.mockResolvedValue(null);

    await expect(service.update("unknown", data, "ADMIN")).rejects.toThrow(
      NotFoundError,
    );
    expect(mockRepository.update).not.toHaveBeenCalled();
  });

  it("ADMIN met à jour la marque", async () => {
    mockRepository.findById.mockResolvedValue(makeBrand());
    mockRepository.update.mockResolvedValue(makeBrand({ name: "Nouveau nom" }));

    const result = await service.update("brand-1", data, "ADMIN");

    expect(mockRepository.update).toHaveBeenCalledWith("brand-1", data);
    expect(result.name).toBe("Nouveau nom");
  });
});

// ── delete ───────────────────────────────────────────────────────────────────

describe("BrandService.delete", () => {
  it.each(FORBIDDEN_ROLES)(
    "%s — ForbiddenError avant toute lecture",
    async (role) => {
      await expect(service.delete("brand-1", role)).rejects.toThrow(
        ForbiddenError,
      );
      expect(mockRepository.findById).not.toHaveBeenCalled();
    },
  );

  it("marque introuvable — NotFoundError", async () => {
    mockRepository.findById.mockResolvedValue(null);

    await expect(service.delete("unknown", "ADMIN")).rejects.toThrow(
      NotFoundError,
    );
    expect(mockRepository.delete).not.toHaveBeenCalled();
  });

  it("ADMIN supprime la marque", async () => {
    mockRepository.findById.mockResolvedValue(makeBrand());
    mockRepository.delete.mockResolvedValue(undefined);

    await service.delete("brand-1", "ADMIN");

    expect(mockRepository.delete).toHaveBeenCalledWith("brand-1");
  });
});