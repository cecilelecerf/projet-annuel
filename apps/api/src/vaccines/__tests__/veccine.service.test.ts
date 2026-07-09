import { describe, it, expect, vi, beforeEach } from "vitest";
import { ForbiddenError, NotFoundError, BadRequestError } from "@api/errors";
import { ActId, PetId, VaccineId } from "@armali/schemas";

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockRepository = vi.hoisted(() => ({
  findById: vi.fn(),
  findByPetId: vi.fn(),
  findAll: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
}));

const mockPetRepository = vi.hoisted(() => ({
  findById: vi.fn(),
}));

vi.mock("@api/vaccines/vaccine.repository", () => ({
  VaccineRepository: vi.fn(function () {
    return mockRepository;
  }),
}));

vi.mock("@api/pets/pet.repository", () => ({
  PetRepository: vi.fn(function () {
    return mockPetRepository;
  }),
}));

const { VaccineService } = await import("@api/vaccines/vaccine.service");
const { VaccineRepository } = await import("@api/vaccines/vaccine.repository");
const { PetRepository } = await import("@api/pets/pet.repository");

const service = new VaccineService(
  new VaccineRepository({} as any),
  new PetRepository({} as any),
);

// ── Fixtures ──────────────────────────────────────────────────────────────────

const makePet = (overrides = {}) => ({
  id: "pet-1" as PetId,
  name: "Chien",
  ...overrides,
});

const makeVaccine = (overrides = {}) => ({
  id: "vaccine-1" as VaccineId,
  recommendedAge: 8,
  boosterInterval: 52,
  petId: "pet-1",
  countryRules: [{ id: "rule-1", country: "FR", minAge: 8, type: "MANDATORY" }],
  act: { id: "act-1" as ActId, name: "Rage", basePrice: 30 },
  ...overrides,
});

const makeCreateData = (overrides = {}) => ({
  name: "Rage",
  description: null,
  basePrice: 30,
  recommendedAge: 8,
  boosterInterval: 52,
  petId: "pet-1" as PetId,
  countryRules: [{ country: "FR", minAge: 8, type: "MANDATORY" as const }],
  ...overrides,
});

beforeEach(() => {
  vi.clearAllMocks();
});

// ── getAll ────────────────────────────────────────────────────────────────────

describe("VaccineService.getAll", () => {
  it("retourne tous les vaccins", async () => {
    mockRepository.findAll.mockResolvedValue([makeVaccine()]);
    const result = await service.getAll();
    expect(result).toHaveLength(1);
  });
});

// ── getById ───────────────────────────────────────────────────────────────────

describe("VaccineService.getById", () => {
  it("vaccin introuvable — NotFoundError", async () => {
    mockRepository.findById.mockResolvedValue(null);
    await expect(service.getById("unknown")).rejects.toThrow(NotFoundError);
  });

  it("retourne le vaccin", async () => {
    const vaccine = makeVaccine();
    mockRepository.findById.mockResolvedValue(vaccine);
    const result = await service.getById("vaccine-1");
    expect(result).toEqual(vaccine);
  });
});

// ── getByPetId ────────────────────────────────────────────────────────────────

describe("VaccineService.getByPetId", () => {
  it("espèce introuvable — NotFoundError", async () => {
    mockPetRepository.findById.mockResolvedValue(null);
    await expect(service.getByPetId("unknown")).rejects.toThrow(NotFoundError);
    expect(mockRepository.findByPetId).not.toHaveBeenCalled();
  });

  it("retourne les vaccins de l'espèce", async () => {
    mockPetRepository.findById.mockResolvedValue(makePet());
    mockRepository.findByPetId.mockResolvedValue([makeVaccine()]);

    const result = await service.getByPetId("pet-1");

    expect(mockRepository.findByPetId).toHaveBeenCalledWith("pet-1");
    expect(result).toHaveLength(1);
  });
});

// ── create ────────────────────────────────────────────────────────────────────

describe("VaccineService.create", () => {
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
  });

  it("règles pays dupliquées (même pays + même type) — BadRequestError", async () => {
    mockPetRepository.findById.mockResolvedValue(makePet());

    await expect(
      service.create(
        makeCreateData({
          countryRules: [
            { country: "FR", minAge: 8, type: "MANDATORY" },
            { country: "FR", minAge: 12, type: "MANDATORY" },
          ],
        }),
        "ADMIN",
      ),
    ).rejects.toThrow(BadRequestError);
    expect(mockRepository.create).not.toHaveBeenCalled();
  });

  it("même pays mais types différents — autorisé, pas de doublon", async () => {
    mockPetRepository.findById.mockResolvedValue(makePet());
    mockRepository.create.mockResolvedValue(makeVaccine());

    await service.create(
      makeCreateData({
        countryRules: [
          { country: "FR", minAge: 8, type: "MANDATORY" },
          { country: "FR", minAge: 8, type: "RECOMMENDED" },
        ],
      }),
      "ADMIN",
    );

    expect(mockRepository.create).toHaveBeenCalledOnce();
  });

  it("crée le vaccin avec succès", async () => {
    const vaccine = makeVaccine();
    mockPetRepository.findById.mockResolvedValue(makePet());
    mockRepository.create.mockResolvedValue(vaccine);

    const result = await service.create(makeCreateData(), "ADMIN");

    expect(mockRepository.create).toHaveBeenCalledOnce();
    expect(result).toEqual(vaccine);
  });
});

// ── update ────────────────────────────────────────────────────────────────────

describe("VaccineService.update", () => {
  it("rôle non ADMIN — ForbiddenError", async () => {
    await expect(
      service.update("vaccine-1", {}, "VETERINARIAN"),
    ).rejects.toThrow(ForbiddenError);
    expect(mockRepository.findById).not.toHaveBeenCalled();
  });

  it("vaccin introuvable — NotFoundError", async () => {
    mockRepository.findById.mockResolvedValue(null);
    await expect(service.update("unknown", {}, "ADMIN")).rejects.toThrow(
      NotFoundError,
    );
  });

  it("countryRules absent du payload — aucune vérification de doublon", async () => {
    mockRepository.findById.mockResolvedValue(makeVaccine());
    mockRepository.update.mockResolvedValue(
      makeVaccine({ recommendedAge: 10 }),
    );

    const result = await service.update(
      "vaccine-1",
      { recommendedAge: 10 },
      "ADMIN",
    );

    expect(mockRepository.update).toHaveBeenCalledWith("vaccine-1", {
      recommendedAge: 10,
    });
    expect(result).toHaveProperty("recommendedAge", 10);
  });

  it("countryRules avec doublon — BadRequestError", async () => {
    mockRepository.findById.mockResolvedValue(makeVaccine());

    await expect(
      service.update(
        "vaccine-1",
        {
          countryRules: [
            { country: "FR", minAge: 8, type: "MANDATORY" },
            { country: "FR", minAge: 12, type: "MANDATORY" },
          ],
        },
        "ADMIN",
      ),
    ).rejects.toThrow(BadRequestError);
    expect(mockRepository.update).not.toHaveBeenCalled();
  });

  it("countryRules sans doublon — succès", async () => {
    mockRepository.findById.mockResolvedValue(makeVaccine());
    mockRepository.update.mockResolvedValue(makeVaccine());

    await service.update(
      "vaccine-1",
      {
        countryRules: [
          { country: "FR", minAge: 8, type: "MANDATORY" },
          { country: "BE", minAge: 12, type: "RECOMMENDED" },
        ],
      },
      "ADMIN",
    );

    expect(mockRepository.update).toHaveBeenCalledOnce();
  });

  it("met à jour le vaccin", async () => {
    mockRepository.findById.mockResolvedValue(makeVaccine());
    mockRepository.update.mockResolvedValue(
      makeVaccine({ boosterInterval: 26 }),
    );

    const result = await service.update(
      "vaccine-1",
      { boosterInterval: 26 },
      "ADMIN",
    );

    expect(result).toHaveProperty("boosterInterval", 26);
  });
});

// ── delete ────────────────────────────────────────────────────────────────────

describe("VaccineService.delete", () => {
  it("rôle non ADMIN — ForbiddenError", async () => {
    await expect(service.delete("vaccine-1", "VETERINARIAN")).rejects.toThrow(
      ForbiddenError,
    );
    expect(mockRepository.findById).not.toHaveBeenCalled();
  });

  it("vaccin introuvable — NotFoundError", async () => {
    mockRepository.findById.mockResolvedValue(null);
    await expect(service.delete("unknown", "ADMIN")).rejects.toThrow(
      NotFoundError,
    );
  });

  it("supprime le vaccin", async () => {
    mockRepository.findById.mockResolvedValue(makeVaccine());
    mockRepository.delete.mockResolvedValue(undefined);

    await service.delete("vaccine-1", "ADMIN");

    expect(mockRepository.delete).toHaveBeenCalledWith("vaccine-1");
  });
});
