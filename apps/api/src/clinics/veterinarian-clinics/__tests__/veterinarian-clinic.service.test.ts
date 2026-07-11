import { describe, it, expect, vi, beforeEach } from "vitest";
import { ForbiddenError, NotFoundError, ConflictError } from "@api/errors";
import { UserRole, VeterinarianClinicId } from "@armali/schemas";

const mockRepository = vi.hoisted(() => ({
  findAll: vi.fn(),
  findById: vi.fn(),
  findByClinic: vi.fn(),
  findByVeterinarian: vi.fn(),
  findByKeys: vi.fn(),
  create: vi.fn(),
  delete: vi.fn(),
}));

vi.mock("../veterinarian-clinic.repository", () => ({
  VeterinarianClinicRepository: vi.fn(function () {
    return mockRepository;
  }),
}));

const { VeterinarianClinicRepository } =
  await import("../veterinarian-clinic.repository");
const { VeterinarianClinicService } =
  await import("../veterinarian-clinic.service");

const service = new VeterinarianClinicService(
  new VeterinarianClinicRepository({} as any),
);

const VC_ID = "vc-1";
const VET_ID = "vet-1";
const CLINIC_ID = "clinic-1";

const makeVeterinarianClinic = (overrides = {}) => ({
  id: VC_ID,
  veterinarianId: VET_ID,
  clinicId: CLINIC_ID,
  createdAt: new Date(),
  veterinarian: { user: { firstname: "Paul" } },
  clinic: { name: "Clinique du Parc" },
  ...overrides,
});

beforeEach(() => vi.clearAllMocks());

// ── getAll ───────────────────────────────────────────────────────────────────

describe("VeterinarianClinicService.getAll", () => {
  it("délègue directement au repository", async () => {
    mockRepository.findAll.mockResolvedValue([makeVeterinarianClinic()]);

    const result = await service.getAll();

    expect(mockRepository.findAll).toHaveBeenCalled();
    expect(result).toHaveLength(1);
  });
});

// ── getById ──────────────────────────────────────────────────────────────────

describe("VeterinarianClinicService.getById", () => {
  it("introuvable — NotFoundError", async () => {
    mockRepository.findById.mockResolvedValue(null);

    await expect(
      service.getById({ id: VC_ID as VeterinarianClinicId }),
    ).rejects.toThrow(NotFoundError);
  });

  it("retourne l'association trouvée", async () => {
    mockRepository.findById.mockResolvedValue(makeVeterinarianClinic());

    const result = await service.getById({ id: VC_ID as VeterinarianClinicId });

    expect(mockRepository.findById).toHaveBeenCalledWith(VC_ID);
    expect(result.id).toBe(VC_ID);
  });
});

// ── getByClinic ──────────────────────────────────────────────────────────────

describe("VeterinarianClinicService.getByClinic", () => {
  it("rôle non-staff (ex: CLIENT) — ForbiddenError", async () => {
    await expect(
      service.getByClinic(CLINIC_ID, "CLIENT" as UserRole),
    ).rejects.toThrow(ForbiddenError);
    expect(mockRepository.findByClinic).not.toHaveBeenCalled();
  });

  it("rôle staff — retourne les associations de la clinique", async () => {
    mockRepository.findByClinic.mockResolvedValue([makeVeterinarianClinic()]);

    const result = await service.getByClinic(
      CLINIC_ID,
      "SECRETARY" as UserRole,
    );

    expect(mockRepository.findByClinic).toHaveBeenCalledWith(CLINIC_ID);
    expect(result).toHaveLength(1);
  });
});

// ── getByVeterinarian ────────────────────────────────────────────────────────

describe("VeterinarianClinicService.getByVeterinarian", () => {
  it("délègue directement au repository, sans vérification de rôle", async () => {
    mockRepository.findByVeterinarian.mockResolvedValue([
      makeVeterinarianClinic(),
    ]);

    const result = await service.getByVeterinarian(VET_ID);

    expect(mockRepository.findByVeterinarian).toHaveBeenCalledWith(VET_ID);
    expect(result).toHaveLength(1);
  });
});

// ── create ───────────────────────────────────────────────────────────────────

describe("VeterinarianClinicService.create", () => {
  it("rôle non-staff — ForbiddenError avant toute lecture", async () => {
    await expect(
      service.create({
        veterinarianId: VET_ID,
        clinicId: CLINIC_ID,
        role: "CLIENT" as UserRole,
      }),
    ).rejects.toThrow(ForbiddenError);

    expect(mockRepository.findByKeys).not.toHaveBeenCalled();
    expect(mockRepository.create).not.toHaveBeenCalled();
  });

  it("association déjà existante — ConflictError", async () => {
    mockRepository.findByKeys.mockResolvedValue(makeVeterinarianClinic());

    await expect(
      service.create({
        veterinarianId: VET_ID,
        clinicId: CLINIC_ID,
        role: "DIRECTOR" as UserRole,
      }),
    ).rejects.toThrow(ConflictError);

    expect(mockRepository.create).not.toHaveBeenCalled();
  });

  it("crée l'association si elle n'existe pas encore", async () => {
    mockRepository.findByKeys.mockResolvedValue(null);
    mockRepository.create.mockResolvedValue(makeVeterinarianClinic());

    const result = await service.create({
      veterinarianId: VET_ID,
      clinicId: CLINIC_ID,
      role: "DIRECTOR" as UserRole,
    });

    expect(mockRepository.findByKeys).toHaveBeenCalledWith(VET_ID, CLINIC_ID);
    expect(mockRepository.create).toHaveBeenCalledWith(VET_ID, CLINIC_ID);
    expect(result.id).toBe(VC_ID);
  });
});

// ── delete ───────────────────────────────────────────────────────────────────

describe("VeterinarianClinicService.delete", () => {
  it("rôle non-staff — ForbiddenError avant toute lecture", async () => {
    await expect(
      service.delete({
        id: VC_ID as VeterinarianClinicId,
        role: "CLIENT" as UserRole,
      }),
    ).rejects.toThrow(ForbiddenError);

    expect(mockRepository.findById).not.toHaveBeenCalled();
    expect(mockRepository.delete).not.toHaveBeenCalled();
  });

  it("introuvable — NotFoundError", async () => {
    mockRepository.findById.mockResolvedValue(null);

    await expect(
      service.delete({
        id: VC_ID as VeterinarianClinicId,
        role: "DIRECTOR" as UserRole,
      }),
    ).rejects.toThrow(NotFoundError);

    expect(mockRepository.delete).not.toHaveBeenCalled();
  });

  it("supprime l'association existante", async () => {
    mockRepository.findById.mockResolvedValue(makeVeterinarianClinic());
    mockRepository.delete.mockResolvedValue(undefined);

    await service.delete({
      id: VC_ID as VeterinarianClinicId,
      role: "DIRECTOR" as UserRole,
    });

    expect(mockRepository.delete).toHaveBeenCalledWith(VC_ID);
  });
});
