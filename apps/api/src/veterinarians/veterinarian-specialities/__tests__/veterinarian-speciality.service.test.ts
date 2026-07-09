import { describe, it, expect, vi, beforeEach } from "vitest";
import { ForbiddenError, NotFoundError, BadRequestError } from "@api/errors";

const mockVeterinarianRepository = vi.hoisted(() => ({
  getAcceptedSpecialities: vi.fn(),
  setAcceptedSpecialities: vi.fn(),
}));

const mockSpecialityRepository = vi.hoisted(() => ({
  findById: vi.fn(),
}));

vi.mock("@api/veterinarians/veterinarian-profile.repository", () => ({
  VeterinarianProfileRepository: vi.fn(function () {
    return mockVeterinarianRepository;
  }),
}));

vi.mock("@api/specialities/speciality.repository", () => ({
  SpecialityRepository: vi.fn(function () {
    return mockSpecialityRepository;
  }),
}));

const { VeterinarianSpecialityService } =
  await import("@api/veterinarians/veterinarian-specialities/veterinarian-speciality.service");
const { VeterinarianProfileRepository } =
  await import("@api/veterinarians/veterinarian-profile.repository");
const { SpecialityRepository } =
  await import("@api/specialities/speciality.repository");

const service = new VeterinarianSpecialityService(
  new VeterinarianProfileRepository({} as any),
  new SpecialityRepository({} as any),
);

const makeSpeciality = (overrides = {}) => ({
  id: "spec-1",
  name: "Cardiologie",
  ...overrides,
});

beforeEach(() => vi.clearAllMocks());

// ── getSpecialities ───────────────────────────────────────────────────────────

describe("VeterinarianSpecialityService.getSpecialities", () => {
  it("vétérinaire introuvable — NotFoundError", async () => {
    mockVeterinarianRepository.getAcceptedSpecialities.mockResolvedValue(null);
    await expect(service.getSpecialities("vet-1" as any)).rejects.toThrow(
      NotFoundError,
    );
  });

  it("retourne les spécialités du vétérinaire", async () => {
    mockVeterinarianRepository.getAcceptedSpecialities.mockResolvedValue([
      makeSpeciality(),
    ]);
    const result = await service.getSpecialities("vet-1" as any);
    expect(result).toHaveLength(1);
  });
});

// ── setSpecialities ───────────────────────────────────────────────────────────

describe("VeterinarianSpecialityService.setSpecialities", () => {
  it("rôle non VETERINARIAN — ForbiddenError", async () => {
    await expect(
      service.setSpecialities(
        "vet-1" as any,
        [],
        "DIRECTOR" as any,
        "vet-1" as any,
      ),
    ).rejects.toThrow(ForbiddenError);
    expect(mockSpecialityRepository.findById).not.toHaveBeenCalled();
  });

  it("VETERINARIAN modifie le profil d'un autre — ForbiddenError", async () => {
    await expect(
      service.setSpecialities(
        "vet-1" as any,
        [],
        "VETERINARIAN" as any,
        "vet-2" as any,
      ),
    ).rejects.toThrow(ForbiddenError);
  });

  it("liste vide — pas de vérification de doublons/existence, succès direct", async () => {
    mockVeterinarianRepository.setAcceptedSpecialities.mockResolvedValue([]);

    const result = await service.setSpecialities(
      "vet-1" as any,
      [],
      "VETERINARIAN" as any,
      "vet-1" as any,
    );

    expect(mockSpecialityRepository.findById).not.toHaveBeenCalled();
    expect(
      mockVeterinarianRepository.setAcceptedSpecialities,
    ).toHaveBeenCalledWith("vet-1", []);
    expect(result).toEqual([]);
  });

  it("doublons dans specialityIds — BadRequestError", async () => {
    await expect(
      service.setSpecialities(
        "vet-1" as any,
        ["spec-1", "spec-1"] as any,
        "VETERINARIAN" as any,
        "vet-1" as any,
      ),
    ).rejects.toThrow(BadRequestError);
    expect(
      mockVeterinarianRepository.setAcceptedSpecialities,
    ).not.toHaveBeenCalled();
  });

  it("une spécialité introuvable — NotFoundError", async () => {
    mockSpecialityRepository.findById
      .mockResolvedValueOnce(makeSpeciality())
      .mockResolvedValueOnce(null);

    await expect(
      service.setSpecialities(
        "vet-1" as any,
        ["spec-1", "spec-2"] as any,
        "VETERINARIAN" as any,
        "vet-1" as any,
      ),
    ).rejects.toThrow(NotFoundError);
    expect(
      mockVeterinarianRepository.setAcceptedSpecialities,
    ).not.toHaveBeenCalled();
  });

  it("toutes les spécialités existent — succès", async () => {
    mockSpecialityRepository.findById.mockResolvedValue(makeSpeciality());
    mockVeterinarianRepository.setAcceptedSpecialities.mockResolvedValue([
      makeSpeciality(),
    ]);

    const result = await service.setSpecialities(
      "vet-1" as any,
      ["spec-1"] as any,
      "VETERINARIAN" as any,
      "vet-1" as any,
    );

    expect(
      mockVeterinarianRepository.setAcceptedSpecialities,
    ).toHaveBeenCalledWith("vet-1", ["spec-1"]);
    expect(result).toHaveLength(1);
  });
});
