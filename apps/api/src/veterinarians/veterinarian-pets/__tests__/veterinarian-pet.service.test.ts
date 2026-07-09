import { describe, it, expect, vi, beforeEach } from "vitest";
import { ForbiddenError, NotFoundError, BadRequestError } from "@api/errors";

const mockVeterinarianRepository = vi.hoisted(() => ({
  getAcceptedPets: vi.fn(),
  setAcceptedPets: vi.fn(),
}));

const mockPetRepository = vi.hoisted(() => ({
  findById: vi.fn(),
}));

vi.mock("@api/veterinarians/veterinarian-profile.repository", () => ({
  VeterinarianProfileRepository: vi.fn(function () {
    return mockVeterinarianRepository;
  }),
}));

vi.mock("@api/pets/pet.repository", () => ({
  PetRepository: vi.fn(function () {
    return mockPetRepository;
  }),
}));

const { VeterinarianPetService } =
  await import("@api/veterinarians/veterinarian-pets/veterinarian-pet.service");
const { VeterinarianProfileRepository } =
  await import("@api/veterinarians/veterinarian-profile.repository");
const { PetRepository } = await import("@api/pets/pet.repository");

const service = new VeterinarianPetService(
  new VeterinarianProfileRepository({} as any),
  new PetRepository({} as any),
);

const makePet = (overrides = {}) => ({
  id: "pet-1",
  name: "Chien",
  ...overrides,
});

beforeEach(() => vi.clearAllMocks());

// ── getPets ───────────────────────────────────────────────────────────────────

describe("VeterinarianPetService.getPets", () => {
  it("vétérinaire introuvable — NotFoundError", async () => {
    mockVeterinarianRepository.getAcceptedPets.mockResolvedValue(null);
    await expect(service.getPets("vet-1" as any)).rejects.toThrow(
      NotFoundError,
    );
  });

  it("retourne les espèces du vétérinaire", async () => {
    mockVeterinarianRepository.getAcceptedPets.mockResolvedValue([makePet()]);
    const result = await service.getPets("vet-1" as any);
    expect(result).toHaveLength(1);
  });
});

// ── setPets ───────────────────────────────────────────────────────────────────

describe("VeterinarianPetService.setPets", () => {
  it("rôle non VETERINARIAN — ForbiddenError", async () => {
    await expect(
      service.setPets("vet-1" as any, [], "DIRECTOR" as any, "vet-1" as any),
    ).rejects.toThrow(ForbiddenError);
    expect(mockPetRepository.findById).not.toHaveBeenCalled();
  });

  it("VETERINARIAN modifie le profil d'un autre — ForbiddenError", async () => {
    await expect(
      service.setPets(
        "vet-1" as any,
        [],
        "VETERINARIAN" as any,
        "vet-2" as any,
      ),
    ).rejects.toThrow(ForbiddenError);
  });

  it("liste vide — pas de vérification de doublons/existence, succès direct", async () => {
    mockVeterinarianRepository.setAcceptedPets.mockResolvedValue([]);

    const result = await service.setPets(
      "vet-1" as any,
      [],
      "VETERINARIAN" as any,
      "vet-1" as any,
    );

    expect(mockPetRepository.findById).not.toHaveBeenCalled();
    expect(mockVeterinarianRepository.setAcceptedPets).toHaveBeenCalledWith(
      "vet-1",
      [],
    );
    expect(result).toEqual([]);
  });

  it("doublons dans petIds — BadRequestError", async () => {
    await expect(
      service.setPets(
        "vet-1" as any,
        ["pet-1", "pet-1"] as any,
        "VETERINARIAN" as any,
        "vet-1" as any,
      ),
    ).rejects.toThrow(BadRequestError);
    expect(mockVeterinarianRepository.setAcceptedPets).not.toHaveBeenCalled();
  });

  it("une espèce introuvable — NotFoundError", async () => {
    mockPetRepository.findById
      .mockResolvedValueOnce(makePet())
      .mockResolvedValueOnce(null);

    await expect(
      service.setPets(
        "vet-1" as any,
        ["pet-1", "pet-2"] as any,
        "VETERINARIAN" as any,
        "vet-1" as any,
      ),
    ).rejects.toThrow(NotFoundError);
    expect(mockVeterinarianRepository.setAcceptedPets).not.toHaveBeenCalled();
  });

  it("toutes les espèces existent — succès", async () => {
    mockPetRepository.findById.mockResolvedValue(makePet());
    mockVeterinarianRepository.setAcceptedPets.mockResolvedValue([makePet()]);

    const result = await service.setPets(
      "vet-1" as any,
      ["pet-1"] as any,
      "VETERINARIAN" as any,
      "vet-1" as any,
    );

    expect(mockVeterinarianRepository.setAcceptedPets).toHaveBeenCalledWith(
      "vet-1",
      ["pet-1"],
    );
    expect(result).toHaveLength(1);
  });
});
