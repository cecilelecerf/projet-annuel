import { VeterinarianClinicId } from "@armali/schemas";
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockRepository = vi.hoisted(() => ({
  findAll: vi.fn(),
  findById: vi.fn(),
  findByClinic: vi.fn(),
  findByVeterinarian: vi.fn(),
  findByVeterinarianAndClinic: vi.fn(),
  create: vi.fn(),
  delete: vi.fn(),
}));

const mockIsStaff = vi.hoisted(() => vi.fn());

vi.mock(
  "@api/clinics/veterinarian-clinics/veterinarian-clinic.repository",
  () => ({
    VeterinarianClinicRepository: vi.fn(function () {
      return mockRepository;
    }),
  }),
);

vi.mock("@api/utils", () => ({
  isStaff: mockIsStaff,
}));

const { VeterinarianClinicRepository } =
  await import("@api/clinics/veterinarian-clinics/veterinarian-clinic.repository");
const { VeterinarianClinicService } =
  await import("@api/clinics/veterinarian-clinics/veterinarian-clinic.service");

const service = new VeterinarianClinicService(
  new VeterinarianClinicRepository({} as any),
);

beforeEach(() => vi.clearAllMocks());

const makeVc = (overrides: Partial<any> = {}) => ({
  id: "vc-1",
  veterinarianId: "vet-1",
  clinicId: "clinic-1",
  veterinarian: {
    user: { id: "vet-1", firstname: "Jean", lastname: "Dupont" },
  },
  clinic: { id: "clinic-1", name: "Clinique A" },
  ...overrides,
});

// ── getAll ───────────────────────────────────────────────────────────────────

describe("VeterinarianClinicService.getAll", () => {
  it("délègue directement au repository", async () => {
    mockRepository.findAll.mockResolvedValue([makeVc()]);

    const result = await service.getAll();

    expect(mockRepository.findAll).toHaveBeenCalled();
    expect(result).toHaveLength(1);
  });
});

// ── getById ──────────────────────────────────────────────────────────────────

describe("VeterinarianClinicService.getById", () => {
  it("retourne l'association trouvée", async () => {
    mockRepository.findById.mockResolvedValue(makeVc());

    const result = await service.getById({
      id: "vc-1" as VeterinarianClinicId,
    });

    expect(mockRepository.findById).toHaveBeenCalledWith("vc-1");
    expect(result.id).toBe("vc-1");
  });

  it("lève NotFoundError si l'association n'existe pas", async () => {
    mockRepository.findById.mockResolvedValue(null);

    await expect(
      service.getById({ id: "unknown" as VeterinarianClinicId }),
    ).rejects.toThrow();
  });
});

// ── getByClinic ──────────────────────────────────────────────────────────────

describe("VeterinarianClinicService.getByClinic", () => {
  it("retourne les associations si le rôle est staff", async () => {
    mockIsStaff.mockReturnValue(true);
    mockRepository.findByClinic.mockResolvedValue([makeVc()]);

    const result = await service.getByClinic("clinic-1", "DIRECTOR");

    expect(mockIsStaff).toHaveBeenCalledWith("DIRECTOR");
    expect(mockRepository.findByClinic).toHaveBeenCalledWith("clinic-1");
    expect(result).toHaveLength(1);
  });

  it("lève ForbiddenError si le rôle n'est pas staff", async () => {
    mockIsStaff.mockReturnValue(false);

    await expect(service.getByClinic("clinic-1", "CLIENT")).rejects.toThrow();
    expect(mockRepository.findByClinic).not.toHaveBeenCalled();
  });
});

// ── getByVeterinarian ────────────────────────────────────────────────────────

describe("VeterinarianClinicService.getByVeterinarian", () => {
  it("délègue directement au repository, sans vérification de rôle", async () => {
    mockRepository.findByVeterinarian.mockResolvedValue([makeVc()]);

    const result = await service.getByVeterinarian("vet-1");

    expect(mockRepository.findByVeterinarian).toHaveBeenCalledWith("vet-1");
    expect(result).toHaveLength(1);
  });
});

// ── create ───────────────────────────────────────────────────────────────────

describe("VeterinarianClinicService.create", () => {
  it("crée l'association si le rôle est staff et qu'aucun doublon n'existe", async () => {
    mockIsStaff.mockReturnValue(true);
    mockRepository.findByVeterinarianAndClinic.mockResolvedValue(null);
    mockRepository.create.mockResolvedValue(makeVc());

    const result = await service.create({
      veterinarianId: "vet-1",
      clinicId: "clinic-1",
      role: "DIRECTOR",
    });

    expect(mockRepository.findByVeterinarianAndClinic).toHaveBeenCalledWith(
      "vet-1",
      "clinic-1",
    );
    expect(mockRepository.create).toHaveBeenCalledWith("vet-1", "clinic-1");
    expect(result.id).toBe("vc-1");
  });

  it("lève ForbiddenError si le rôle n'est pas staff", async () => {
    mockIsStaff.mockReturnValue(false);

    await expect(
      service.create({
        veterinarianId: "vet-1",
        clinicId: "clinic-1",
        role: "CLIENT",
      }),
    ).rejects.toThrow();
    expect(mockRepository.findByVeterinarianAndClinic).not.toHaveBeenCalled();
    expect(mockRepository.create).not.toHaveBeenCalled();
  });

  it("lève ConflictError si l'association existe déjà", async () => {
    mockIsStaff.mockReturnValue(true);
    mockRepository.findByVeterinarianAndClinic.mockResolvedValue(makeVc());

    await expect(
      service.create({
        veterinarianId: "vet-1",
        clinicId: "clinic-1",
        role: "DIRECTOR",
      }),
    ).rejects.toThrow();
    expect(mockRepository.create).not.toHaveBeenCalled();
  });
});

// ── delete ───────────────────────────────────────────────────────────────────

describe("VeterinarianClinicService.delete", () => {
  it("supprime l'association si le rôle est staff et qu'elle existe", async () => {
    mockIsStaff.mockReturnValue(true);
    mockRepository.findById.mockResolvedValue(makeVc());
    mockRepository.delete.mockResolvedValue(undefined);

    await service.delete({
      id: "vc-1" as VeterinarianClinicId,
      role: "DIRECTOR",
    });

    expect(mockRepository.findById).toHaveBeenCalledWith("vc-1");
    expect(mockRepository.delete).toHaveBeenCalledWith("vc-1");
  });

  it("lève ForbiddenError si le rôle n'est pas staff", async () => {
    mockIsStaff.mockReturnValue(false);

    await expect(
      service.delete({ id: "vc-1" as VeterinarianClinicId, role: "CLIENT" }),
    ).rejects.toThrow();
    expect(mockRepository.findById).not.toHaveBeenCalled();
    expect(mockRepository.delete).not.toHaveBeenCalled();
  });

  it("lève NotFoundError si l'association n'existe pas", async () => {
    mockIsStaff.mockReturnValue(true);
    mockRepository.findById.mockResolvedValue(null);

    await expect(
      service.delete({
        id: "unknown" as VeterinarianClinicId,
        role: "DIRECTOR",
      }),
    ).rejects.toThrow();
    expect(mockRepository.delete).not.toHaveBeenCalled();
  });
});
