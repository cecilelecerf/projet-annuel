import { describe, it, expect, vi, beforeEach } from "vitest";
import { ForbiddenError, NotFoundError, BadRequestError } from "@api/errors";
import { PetId, RaceId } from "@armali/schemas";

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockRepository = vi.hoisted(() => ({
  findById: vi.fn(),
  findByPetId: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  hasAnimals: vi.fn(),
}));

const mockPetRepository = vi.hoisted(() => ({
  findById: vi.fn(),
}));

vi.mock("@api/races/race.repository", () => ({
  RaceRepository: vi.fn(function () {
    return mockRepository;
  }),
}));

vi.mock("@api/pets/pet.repository", () => ({
  PetRepository: vi.fn(function () {
    return mockPetRepository;
  }),
}));

const { RaceService } = await import("@api/races/race.service");
const { RaceRepository } = await import("@api/races/race.repository");
const { PetRepository } = await import("@api/pets/pet.repository");

const service = new RaceService(
  new RaceRepository({} as any),
  new PetRepository({} as any),
);

// ── Fixtures ──────────────────────────────────────────────────────────────────

const makePet = (overrides = {}) => ({
  id: "pet-1" as PetId,
  name: "Chien",
  ...overrides,
});

const makeRace = (overrides = {}) => ({
  id: "race-1" as RaceId,
  name: "Labrador",
  petId: "pet-1" as PetId,
  ...overrides,
});

const makeCreateData = (overrides = {}) => ({
  name: "Labrador",
  petId: "pet-1" as PetId,
  ...overrides,
});

beforeEach(() => {
  vi.clearAllMocks();
});

// ── getByPetId ────────────────────────────────────────────────────────────────

describe("RaceService.getByPetId", () => {
  it("espèce introuvable — NotFoundError", async () => {
    mockPetRepository.findById.mockResolvedValue(null);
    await expect(service.getByPetId("unknown")).rejects.toThrow(NotFoundError);
    expect(mockRepository.findByPetId).not.toHaveBeenCalled();
  });

  it("retourne les races de l'espèce", async () => {
    mockPetRepository.findById.mockResolvedValue(makePet());
    mockRepository.findByPetId.mockResolvedValue([makeRace()]);

    const result = await service.getByPetId("pet-1");

    expect(mockRepository.findByPetId).toHaveBeenCalledWith("pet-1");
    expect(result).toHaveLength(1);
  });
});

// ── getById ───────────────────────────────────────────────────────────────────

describe("RaceService.getById", () => {
  it("race introuvable — NotFoundError", async () => {
    mockRepository.findById.mockResolvedValue(null);
    await expect(service.getById("unknown")).rejects.toThrow(NotFoundError);
  });

  it("retourne la race", async () => {
    const race = makeRace();
    mockRepository.findById.mockResolvedValue(race);
    const result = await service.getById("race-1");
    expect(result).toEqual(race);
  });
});

// ── create ────────────────────────────────────────────────────────────────────

describe("RaceService.create", () => {
  it("rôle non ADMIN — ForbiddenError", async () => {
    await expect(
      service.create(makeCreateData(), "VETERINARIAN"),
    ).rejects.toThrow(ForbiddenError);
    expect(mockPetRepository.findById).not.toHaveBeenCalled();
  });

  it("espèce introuvable — NotFoundError", async () => {
    mockPetRepository.findById.mockResolvedValue(null);
    await expect(service.create(makeCreateData(), "ADMIN")).rejects.toThrow(
      NotFoundError,
    );
    expect(mockRepository.create).not.toHaveBeenCalled();
  });

  it("crée la race avec succès", async () => {
    const race = makeRace();
    mockPetRepository.findById.mockResolvedValue(makePet());
    mockRepository.create.mockResolvedValue(race);

    const result = await service.create(makeCreateData(), "ADMIN");

    expect(mockRepository.create).toHaveBeenCalledOnce();
    expect(result).toEqual(race);
  });
});

// ── update ────────────────────────────────────────────────────────────────────

describe("RaceService.update", () => {
  it("rôle non ADMIN — ForbiddenError", async () => {
    await expect(service.update("race-1", {}, "VETERINARIAN")).rejects.toThrow(
      ForbiddenError,
    );
    expect(mockRepository.findById).not.toHaveBeenCalled();
  });

  it("race introuvable — NotFoundError", async () => {
    mockRepository.findById.mockResolvedValue(null);
    await expect(service.update("unknown", {}, "ADMIN")).rejects.toThrow(
      NotFoundError,
    );
    expect(mockRepository.update).not.toHaveBeenCalled();
  });

  it("met à jour la race", async () => {
    mockRepository.findById.mockResolvedValue(makeRace());
    mockRepository.update.mockResolvedValue(
      makeRace({ name: "Berger Allemand" }),
    );

    const result = await service.update(
      "race-1",
      { name: "Berger Allemand" },
      "ADMIN",
    );

    expect(mockRepository.update).toHaveBeenCalledWith("race-1", {
      name: "Berger Allemand",
    });
    expect(result).toHaveProperty("name", "Berger Allemand");
  });
});

// ── delete ────────────────────────────────────────────────────────────────────

describe("RaceService.delete", () => {
  it("rôle non ADMIN — ForbiddenError", async () => {
    await expect(service.delete("race-1", "VETERINARIAN")).rejects.toThrow(
      ForbiddenError,
    );
    expect(mockRepository.findById).not.toHaveBeenCalled();
  });

  it("race introuvable — NotFoundError", async () => {
    mockRepository.findById.mockResolvedValue(null);
    await expect(service.delete("unknown", "ADMIN")).rejects.toThrow(
      NotFoundError,
    );
    expect(mockRepository.hasAnimals).not.toHaveBeenCalled();
  });

  it("race référencée par des animaux — BadRequestError", async () => {
    mockRepository.findById.mockResolvedValue(makeRace());
    mockRepository.hasAnimals.mockResolvedValue(true);

    await expect(service.delete("race-1", "ADMIN")).rejects.toThrow(
      BadRequestError,
    );
    expect(mockRepository.delete).not.toHaveBeenCalled();
  });

  it("supprime la race non référencée", async () => {
    mockRepository.findById.mockResolvedValue(makeRace());
    mockRepository.hasAnimals.mockResolvedValue(false);
    mockRepository.delete.mockResolvedValue(undefined);

    await service.delete("race-1", "ADMIN");

    expect(mockRepository.delete).toHaveBeenCalledWith("race-1");
  });
});
