import { describe, it, expect, vi, beforeEach } from "vitest";
import { ForbiddenError, NotFoundError, BadRequestError } from "@api/errors";

const mockClinicRepository = vi.hoisted(() => ({
  getAcceptedPets: vi.fn(),
  setAcceptedPets: vi.fn(),
}));

const mockPetRepository = vi.hoisted(() => ({
  findById: vi.fn(),
}));

const mockClinicService = vi.hoisted(() => ({
  getClinicsByUser: vi.fn(),
}));

vi.mock("@api/clinics/clinic.repository", () => ({
  ClinicRepository: vi.fn(function () {
    return mockClinicRepository;
  }),
}));

vi.mock("@api/pets/pet.repository", () => ({
  PetRepository: vi.fn(function () {
    return mockPetRepository;
  }),
}));

vi.mock("@api/clinics/clinic.service", () => ({
  ClinicService: vi.fn(function () {
    return mockClinicService;
  }),
}));

const { ClinicPetService } =
  await import("@api/clinics/clinic-pets/clinic-pet.service");
const { ClinicRepository } = await import("@api/clinics/clinic.repository");
const { PetRepository } = await import("@api/pets/pet.repository");
const { ClinicService } = await import("@api/clinics/clinic.service");

const service = new ClinicPetService(
  new ClinicRepository({} as any),
  new PetRepository({} as any),
  new ClinicService({} as any),
);

const makePet = (overrides = {}) => ({
  id: "pet-1",
  name: "Chien",
  ...overrides,
});

beforeEach(() => vi.clearAllMocks());

// ── getAcceptedPets ───────────────────────────────────────────────────────────

describe("ClinicPetService.getAcceptedPets", () => {
  it("clinique introuvable — NotFoundError", async () => {
    mockClinicRepository.getAcceptedPets.mockResolvedValue(null);
    await expect(service.getAcceptedPets("clinic-1" as any)).rejects.toThrow(
      NotFoundError,
    );
  });

  it("retourne les espèces acceptées", async () => {
    mockClinicRepository.getAcceptedPets.mockResolvedValue([makePet()]);
    const result = await service.getAcceptedPets("clinic-1" as any);
    expect(result).toHaveLength(1);
  });
});

// ── setAcceptedPets ───────────────────────────────────────────────────────────

describe("ClinicPetService.setAcceptedPets", () => {
  it("rôle non owner (VETERINARIAN) — ForbiddenError", async () => {
    await expect(
      service.setAcceptedPets(
        "clinic-1" as any,
        [],
        "VETERINARIAN" as any,
        "user-1" as any,
      ),
    ).rejects.toThrow(ForbiddenError);
    expect(mockClinicService.getClinicsByUser).not.toHaveBeenCalled();
  });

  it("utilisateur n'appartient pas à la clinique — ForbiddenError", async () => {
    mockClinicService.getClinicsByUser.mockResolvedValue([
      { id: "autre-clinic" },
    ]);

    await expect(
      service.setAcceptedPets(
        "clinic-1" as any,
        [],
        "DIRECTOR" as any,
        "user-1" as any,
      ),
    ).rejects.toThrow(ForbiddenError);
    expect(mockPetRepository.findById).not.toHaveBeenCalled();
  });

  it("utilisateur appartient à la clinique, liste vide — succès direct", async () => {
    mockClinicService.getClinicsByUser.mockResolvedValue([{ id: "clinic-1" }]);
    mockClinicRepository.setAcceptedPets.mockResolvedValue([]);

    const result = await service.setAcceptedPets(
      "clinic-1" as any,
      [],
      "DIRECTOR" as any,
      "user-1" as any,
    );

    expect(mockPetRepository.findById).not.toHaveBeenCalled();
    expect(mockClinicRepository.setAcceptedPets).toHaveBeenCalledWith(
      "clinic-1",
      [],
    );
    expect(result).toEqual([]);
  });

  it("doublons dans petIds — BadRequestError", async () => {
    mockClinicService.getClinicsByUser.mockResolvedValue([{ id: "clinic-1" }]);

    await expect(
      service.setAcceptedPets(
        "clinic-1" as any,
        ["pet-1", "pet-1"] as any,
        "DIRECTOR" as any,
        "user-1" as any,
      ),
    ).rejects.toThrow(BadRequestError);
    expect(mockClinicRepository.setAcceptedPets).not.toHaveBeenCalled();
  });

  it("une espèce introuvable — NotFoundError", async () => {
    mockClinicService.getClinicsByUser.mockResolvedValue([{ id: "clinic-1" }]);
    mockPetRepository.findById
      .mockResolvedValueOnce(makePet())
      .mockResolvedValueOnce(null);

    await expect(
      service.setAcceptedPets(
        "clinic-1" as any,
        ["pet-1", "pet-2"] as any,
        "DIRECTOR" as any,
        "user-1" as any,
      ),
    ).rejects.toThrow(NotFoundError);
    expect(mockClinicRepository.setAcceptedPets).not.toHaveBeenCalled();
  });

  it("REFERENT dans sa clinique — succès", async () => {
    mockClinicService.getClinicsByUser.mockResolvedValue([{ id: "clinic-1" }]);
    mockPetRepository.findById.mockResolvedValue(makePet());
    mockClinicRepository.setAcceptedPets.mockResolvedValue([makePet()]);

    const result = await service.setAcceptedPets(
      "clinic-1" as any,
      ["pet-1"] as any,
      "REFERENT" as any,
      "user-1" as any,
    );

    expect(mockClinicRepository.setAcceptedPets).toHaveBeenCalledWith(
      "clinic-1",
      ["pet-1"],
    );
    expect(result).toHaveLength(1);
  });
});
