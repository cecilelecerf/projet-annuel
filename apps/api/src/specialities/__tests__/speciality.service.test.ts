import { describe, it, expect, vi, beforeEach } from "vitest";
import { NotFoundError, ForbiddenError, BadRequestError } from "@api/errors";

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockRepository = vi.hoisted(() => ({
  findAll: vi.fn(),
  findById: vi.fn(),
  findByExactName: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  linkWithClinic: vi.fn(),
  findAllByClinicId: vi.fn(),
}));

vi.mock("../speciality.repository", () => ({
  SpecialityRepository: vi.fn(function () {
    return mockRepository;
  }),
}));

const { SpecialityRepository } = await import("../speciality.repository");
const { SpecialityService } = await import("../speciality.service");

const service = new SpecialityService(new SpecialityRepository({} as any));

// ── Fixtures ──────────────────────────────────────────────────────────────────

const SPECIALITY_ID = "11111111-1111-4111-8111-111111111111";
const CLINIC_ID = "22222222-2222-4222-8222-222222222222";
const USER_ID = "33333333-3333-4333-8333-333333333333";

const makeSpeciality = (overrides = {}) => ({
  id: SPECIALITY_ID,
  name: "Cardiologie",
  description: "Maladies cardiaques et vasculaires",
  ...overrides,
});

beforeEach(() => vi.clearAllMocks());

// ── getAll ─────────────────────────────────────────────────────────────────────

describe("SpecialityService.getAll", () => {
  it("délègue au repository avec le terme de recherche", async () => {
    mockRepository.findAll.mockResolvedValue([makeSpeciality()]);

    const result = await service.getAll("cardio");

    expect(mockRepository.findAll).toHaveBeenCalledWith("cardio");
    expect(result).toHaveLength(1);
  });

  it("fonctionne sans terme de recherche", async () => {
    mockRepository.findAll.mockResolvedValue([]);

    await service.getAll();

    expect(mockRepository.findAll).toHaveBeenCalledWith(undefined);
  });
});

// ── getById ────────────────────────────────────────────────────────────────────

describe("SpecialityService.getById", () => {
  it("introuvable — NotFoundError", async () => {
    mockRepository.findById.mockResolvedValue(null);

    await expect(service.getById(SPECIALITY_ID)).rejects.toThrow(NotFoundError);
  });

  it("retourne la spécialité trouvée", async () => {
    mockRepository.findById.mockResolvedValue(makeSpeciality());

    const result = await service.getById(SPECIALITY_ID);

    expect(result).toEqual(makeSpeciality());
  });
});

// ── create ─────────────────────────────────────────────────────────────────────

describe("SpecialityService.create", () => {
  const payload = { name: "Dermatologie", description: "Maladies de peau" };

  it("rôle non-ADMIN — ForbiddenError", async () => {
    await expect(service.create(payload, "DIRECTOR")).rejects.toThrow(
      ForbiddenError,
    );
    expect(mockRepository.create).not.toHaveBeenCalled();
  });

  it("description manquante — BadRequestError", async () => {
    await expect(
      service.create({ name: "Dermatologie" } as any, "ADMIN"),
    ).rejects.toThrow(BadRequestError);
    expect(mockRepository.create).not.toHaveBeenCalled();
  });

  it("nom déjà existant — retourne l'existant sans créer de doublon", async () => {
    const existing = makeSpeciality({ name: payload.name });
    mockRepository.findByExactName.mockResolvedValue(existing);

    const result = await service.create(payload, "ADMIN");

    expect(mockRepository.create).not.toHaveBeenCalled();
    expect(result).toEqual(existing);
  });

  it("crée la spécialité si elle n'existe pas encore", async () => {
    mockRepository.findByExactName.mockResolvedValue(null);
    mockRepository.create.mockResolvedValue(makeSpeciality(payload));

    const result = await service.create(payload, "ADMIN");

    expect(mockRepository.create).toHaveBeenCalledWith(payload);
    expect(result.name).toBe(payload.name);
  });
});

// ── update ─────────────────────────────────────────────────────────────────────

describe("SpecialityService.update", () => {
  const payload = { description: "Nouvelle description" };

  it("rôle non-ADMIN — ForbiddenError", async () => {
    await expect(
      service.update(SPECIALITY_ID, payload, "DIRECTOR"),
    ).rejects.toThrow(ForbiddenError);
    expect(mockRepository.update).not.toHaveBeenCalled();
  });

  it("introuvable — NotFoundError", async () => {
    mockRepository.findById.mockResolvedValue(null);

    await expect(
      service.update(SPECIALITY_ID, payload, "ADMIN"),
    ).rejects.toThrow(NotFoundError);
    expect(mockRepository.update).not.toHaveBeenCalled();
  });

  it("met à jour la spécialité", async () => {
    mockRepository.findById.mockResolvedValue(makeSpeciality());
    mockRepository.update.mockResolvedValue(makeSpeciality(payload));

    const result = await service.update(SPECIALITY_ID, payload, "ADMIN");

    expect(mockRepository.update).toHaveBeenCalledWith(SPECIALITY_ID, payload);
    expect(result.description).toBe(payload.description);
  });
});

// ── delete ─────────────────────────────────────────────────────────────────────

describe("SpecialityService.delete", () => {
  it("rôle non-ADMIN — ForbiddenError", async () => {
    await expect(service.delete(SPECIALITY_ID, "DIRECTOR")).rejects.toThrow(
      ForbiddenError,
    );
    expect(mockRepository.delete).not.toHaveBeenCalled();
  });

  it("introuvable — NotFoundError", async () => {
    mockRepository.findById.mockResolvedValue(null);

    await expect(service.delete(SPECIALITY_ID, "ADMIN")).rejects.toThrow(
      NotFoundError,
    );
    expect(mockRepository.delete).not.toHaveBeenCalled();
  });

  it("supprime la spécialité", async () => {
    mockRepository.findById.mockResolvedValue(makeSpeciality());
    mockRepository.delete.mockResolvedValue(undefined);

    await service.delete(SPECIALITY_ID, "ADMIN");

    expect(mockRepository.delete).toHaveBeenCalledWith(SPECIALITY_ID);
  });
});
