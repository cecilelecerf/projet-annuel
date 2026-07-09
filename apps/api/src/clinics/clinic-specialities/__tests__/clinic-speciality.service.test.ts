import { describe, it, expect, vi, beforeEach } from "vitest";
import { ForbiddenError, NotFoundError, BadRequestError } from "@api/errors";

const mockClinicRepository = vi.hoisted(() => ({
  getAcceptedSpecialities: vi.fn(),
  setAcceptedSpecialities: vi.fn(),
}));

const mockSpecialityRepository = vi.hoisted(() => ({
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

vi.mock("@api/specialities/speciality.repository", () => ({
  SpecialityRepository: vi.fn(function () {
    return mockSpecialityRepository;
  }),
}));

vi.mock("@api/clinics/clinic.service", () => ({
  ClinicService: vi.fn(function () {
    return mockClinicService;
  }),
}));

const { ClinicSpecialityService } =
  await import("@api/clinics/clinic-specialities/clinic-speciality.service");
const { ClinicRepository } = await import("@api/clinics/clinic.repository");
const { SpecialityRepository } =
  await import("@api/specialities/speciality.repository");
const { ClinicService } = await import("@api/clinics/clinic.service");

const service = new ClinicSpecialityService(
  new ClinicRepository({} as any),
  new SpecialityRepository({} as any),
  new ClinicService({} as any),
);

const makeSpeciality = (overrides = {}) => ({
  id: "spec-1",
  name: "Cardiologie",
  ...overrides,
});

beforeEach(() => vi.clearAllMocks());

// ── getAcceptedSpecialities ───────────────────────────────────────────────────

describe("ClinicSpecialityService.getAcceptedSpecialities", () => {
  it("clinique introuvable — NotFoundError", async () => {
    mockClinicRepository.getAcceptedSpecialities.mockResolvedValue(null);
    await expect(
      service.getAcceptedSpecialities("clinic-1" as any),
    ).rejects.toThrow(NotFoundError);
  });

  it("retourne les spécialités acceptées", async () => {
    mockClinicRepository.getAcceptedSpecialities.mockResolvedValue([
      makeSpeciality(),
    ]);
    const result = await service.getAcceptedSpecialities("clinic-1" as any);
    expect(result).toHaveLength(1);
  });
});

// ── setAcceptedSpecialities ───────────────────────────────────────────────────

describe("ClinicSpecialityService.setAcceptedSpecialities", () => {
  it("rôle non owner (SECRETARY) — ForbiddenError", async () => {
    await expect(
      service.setAcceptedSpecialities(
        "clinic-1" as any,
        [],
        "SECRETARY" as any,
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
      service.setAcceptedSpecialities(
        "clinic-1" as any,
        [],
        "DIRECTOR" as any,
        "user-1" as any,
      ),
    ).rejects.toThrow(ForbiddenError);
    expect(mockSpecialityRepository.findById).not.toHaveBeenCalled();
  });

  it("utilisateur appartient à la clinique, liste vide — succès direct", async () => {
    mockClinicService.getClinicsByUser.mockResolvedValue([{ id: "clinic-1" }]);
    mockClinicRepository.setAcceptedSpecialities.mockResolvedValue([]);

    const result = await service.setAcceptedSpecialities(
      "clinic-1" as any,
      [],
      "DIRECTOR" as any,
      "user-1" as any,
    );

    expect(mockSpecialityRepository.findById).not.toHaveBeenCalled();
    expect(mockClinicRepository.setAcceptedSpecialities).toHaveBeenCalledWith(
      "clinic-1",
      [],
    );
    expect(result).toEqual([]);
  });

  it("doublons dans specialityIds — BadRequestError", async () => {
    mockClinicService.getClinicsByUser.mockResolvedValue([{ id: "clinic-1" }]);

    await expect(
      service.setAcceptedSpecialities(
        "clinic-1" as any,
        ["spec-1", "spec-1"] as any,
        "DIRECTOR" as any,
        "user-1" as any,
      ),
    ).rejects.toThrow(BadRequestError);
    expect(mockClinicRepository.setAcceptedSpecialities).not.toHaveBeenCalled();
  });

  it("une spécialité introuvable — NotFoundError", async () => {
    mockClinicService.getClinicsByUser.mockResolvedValue([{ id: "clinic-1" }]);
    mockSpecialityRepository.findById
      .mockResolvedValueOnce(makeSpeciality())
      .mockResolvedValueOnce(null);

    await expect(
      service.setAcceptedSpecialities(
        "clinic-1" as any,
        ["spec-1", "spec-2"] as any,
        "DIRECTOR" as any,
        "user-1" as any,
      ),
    ).rejects.toThrow(NotFoundError);
    expect(mockClinicRepository.setAcceptedSpecialities).not.toHaveBeenCalled();
  });

  it("REFERENT dans sa clinique — succès", async () => {
    mockClinicService.getClinicsByUser.mockResolvedValue([{ id: "clinic-1" }]);
    mockSpecialityRepository.findById.mockResolvedValue(makeSpeciality());
    mockClinicRepository.setAcceptedSpecialities.mockResolvedValue([
      makeSpeciality(),
    ]);

    const result = await service.setAcceptedSpecialities(
      "clinic-1" as any,
      ["spec-1"] as any,
      "REFERENT" as any,
      "user-1" as any,
    );

    expect(mockClinicRepository.setAcceptedSpecialities).toHaveBeenCalledWith(
      "clinic-1",
      ["spec-1"],
    );
    expect(result).toHaveLength(1);
  });
});
