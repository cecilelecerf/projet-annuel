import { describe, it, expect, vi, beforeEach } from "vitest";
import { ForbiddenError, NotFoundError, BadRequestError } from "@api/errors";

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockRepository = vi.hoisted(() => ({
  findById: vi.fn(),
  findAll: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  hasReferences: vi.fn(),
}));

vi.mock("@api/pets/pet.repository", () => ({
  PetRepository: vi.fn(function () {
    return mockRepository;
  }),
}));

const { PetService } = await import("@api/pets/pet.service");
const { PetRepository } = await import("@api/pets/pet.repository");

const service = new PetService(new PetRepository({} as any));

// ── Fixtures ──────────────────────────────────────────────────────────────────

const makePet = (overrides = {}) => ({
  id: "pet-1",
  name: "Chien",
  picture: null,
  races: [],
  ...overrides,
});

const makeCreateData = (overrides = {}) => ({
  name: "Chien",
  picture: null,
  ...overrides,
});

beforeEach(() => {
  vi.clearAllMocks();
});

// ── getAll ────────────────────────────────────────────────────────────────────

describe("PetService.getAll", () => {
  it("retourne toutes les espèces", async () => {
    mockRepository.findAll.mockResolvedValue([makePet()]);
    const result = await service.getAll();
    expect(result).toHaveLength(1);
  });
});

// ── getById ───────────────────────────────────────────────────────────────────

describe("PetService.getById", () => {
  it("espèce introuvable — NotFoundError", async () => {
    mockRepository.findById.mockResolvedValue(null);
    await expect(service.getById("unknown")).rejects.toThrow(NotFoundError);
  });

  it("retourne l'espèce", async () => {
    const pet = makePet();
    mockRepository.findById.mockResolvedValue(pet);
    const result = await service.getById("pet-1");
    expect(result).toEqual(pet);
  });
});

// ── create ────────────────────────────────────────────────────────────────────

describe("PetService.create", () => {
  it("rôle non ADMIN — ForbiddenError", async () => {
    await expect(
      service.create(makeCreateData(), "VETERINARIAN"),
    ).rejects.toThrow(ForbiddenError);
    expect(mockRepository.create).not.toHaveBeenCalled();
  });

  it("crée l'espèce avec succès", async () => {
    const pet = makePet();
    mockRepository.create.mockResolvedValue(pet);

    const result = await service.create(makeCreateData(), "ADMIN");

    expect(mockRepository.create).toHaveBeenCalledOnce();
    expect(result).toEqual(pet);
  });
});

// ── update ────────────────────────────────────────────────────────────────────

describe("PetService.update", () => {
  it("rôle non ADMIN — ForbiddenError", async () => {
    await expect(service.update("pet-1", {}, "VETERINARIAN")).rejects.toThrow(
      ForbiddenError,
    );
    expect(mockRepository.findById).not.toHaveBeenCalled();
  });

  it("espèce introuvable — NotFoundError", async () => {
    mockRepository.findById.mockResolvedValue(null);
    await expect(service.update("unknown", {}, "ADMIN")).rejects.toThrow(
      NotFoundError,
    );
    expect(mockRepository.update).not.toHaveBeenCalled();
  });

  it("met à jour l'espèce", async () => {
    mockRepository.findById.mockResolvedValue(makePet());
    mockRepository.update.mockResolvedValue(makePet({ name: "Chat" }));

    const result = await service.update("pet-1", { name: "Chat" }, "ADMIN");

    expect(mockRepository.update).toHaveBeenCalledWith("pet-1", {
      name: "Chat",
    });
    expect(result).toHaveProperty("name", "Chat");
  });
});

// ── delete ────────────────────────────────────────────────────────────────────

describe("PetService.delete", () => {
  it("rôle non ADMIN — ForbiddenError", async () => {
    await expect(service.delete("pet-1", "VETERINARIAN")).rejects.toThrow(
      ForbiddenError,
    );
    expect(mockRepository.findById).not.toHaveBeenCalled();
  });

  it("espèce introuvable — NotFoundError", async () => {
    mockRepository.findById.mockResolvedValue(null);
    await expect(service.delete("unknown", "ADMIN")).rejects.toThrow(
      NotFoundError,
    );
    expect(mockRepository.hasReferences).not.toHaveBeenCalled();
  });

  it("espèce référencée ailleurs — BadRequestError", async () => {
    mockRepository.findById.mockResolvedValue(makePet());
    mockRepository.hasReferences.mockResolvedValue(true);

    await expect(service.delete("pet-1", "ADMIN")).rejects.toThrow(
      BadRequestError,
    );
    expect(mockRepository.delete).not.toHaveBeenCalled();
  });

  it("supprime l'espèce non référencée", async () => {
    mockRepository.findById.mockResolvedValue(makePet());
    mockRepository.hasReferences.mockResolvedValue(false);
    mockRepository.delete.mockResolvedValue(undefined);

    await service.delete("pet-1", "ADMIN");

    expect(mockRepository.delete).toHaveBeenCalledWith("pet-1");
  });
});
