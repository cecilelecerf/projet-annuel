import { describe, it, expect, vi, beforeEach } from "vitest";
import { ForbiddenError, NotFoundError, ConflictError } from "@api/errors";
import type { UserId, ClinicId } from "@armali/schemas";

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockStaffRepository = vi.hoisted(() => ({
  findStaff: vi.fn(),
  findMemberDetailById: vi.fn(),
  createVeterinarian: vi.fn(),
  createSecretary: vi.fn(),
  createReferent: vi.fn(),
}));

const mockClinicService = vi.hoisted(() => ({
  getClinicByUser: vi.fn(),
}));

vi.mock("../staff.repository", () => ({
  StaffRepository: vi.fn(function () {
    return mockStaffRepository;
  }),
}));

vi.mock("@api/clinics/clinic.service", () => ({
  ClinicService: vi.fn(function () {
    return mockClinicService;
  }),
}));

vi.mock("bcryptjs", () => ({
  hash: vi.fn().mockResolvedValue("hashed_password"),
}));

const { StaffRepository } = await import("../staff.repository");
const { ClinicService } = await import("@api/clinics/clinic.service");
const { StaffService } = await import("../staff.service");

const staffService = new StaffService(
  new StaffRepository({} as any),
  new ClinicService({} as any),
);

// ── Fixtures ──────────────────────────────────────────────────────────────────

const CLINIC_ID = "11111111-1111-4111-8111-111111111111" as ClinicId;
const OTHER_CLINIC_ID = "22222222-2222-4222-8222-222222222222" as ClinicId;
const AUTHOR_ID = "33333333-3333-4333-8333-333333333333" as UserId;
const MEMBER_ID = "44444444-4444-4444-8444-444444444444" as UserId;

const makeUser = (overrides = {}) => ({
  id: "user-1",
  firstname: "Alice",
  lastname: "Dupont",
  email: "alice@test.com",
  ...overrides,
});

const makeClinicStaff = (overrides = {}) => ({
  director: { ...makeUser(), role: "DIRECTOR" as const },
  referents: [],
  secretaries: [],
  veterinarians: [],
  ...overrides,
});

beforeEach(() => vi.clearAllMocks());

// ── getStaffByClinicRole ────────────────────────────────────────────────────

describe("StaffService.getStaffByClinicRole", () => {
  it("rôle non-staff — ForbiddenError", async () => {
    await expect(
      staffService.getStaffByClinicRole({
        authorId: AUTHOR_ID,
        clinicId: CLINIC_ID,
        role: "CLIENT",
      }),
    ).rejects.toThrow(ForbiddenError);
  });

  it("l'acteur n'a pas accès à cette clinique — ForbiddenError", async () => {
    mockClinicService.getClinicByUser.mockResolvedValue([
      { id: OTHER_CLINIC_ID },
    ]);

    await expect(
      staffService.getStaffByClinicRole({
        authorId: AUTHOR_ID,
        clinicId: CLINIC_ID,
        role: "DIRECTOR",
      }),
    ).rejects.toThrow(ForbiddenError);

    expect(mockStaffRepository.findStaff).not.toHaveBeenCalled();
  });

  it("clinique introuvable — NotFoundError", async () => {
    mockClinicService.getClinicByUser.mockResolvedValue([{ id: CLINIC_ID }]);
    mockStaffRepository.findStaff.mockResolvedValue(null);

    await expect(
      staffService.getStaffByClinicRole({
        authorId: AUTHOR_ID,
        clinicId: CLINIC_ID,
        role: "DIRECTOR",
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("clinique sans directeur — NotFoundError", async () => {
    mockClinicService.getClinicByUser.mockResolvedValue([{ id: CLINIC_ID }]);
    mockStaffRepository.findStaff.mockResolvedValue(
      makeClinicStaff({ director: null }),
    );

    await expect(
      staffService.getStaffByClinicRole({
        authorId: AUTHOR_ID,
        clinicId: CLINIC_ID,
        role: "DIRECTOR",
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("sans targetRoles — retourne tout le staff", async () => {
    mockClinicService.getClinicByUser.mockResolvedValue([{ id: CLINIC_ID }]);
    mockStaffRepository.findStaff.mockResolvedValue(
      makeClinicStaff({
        referents: [{ ...makeUser({ id: "ref-1" }), role: "REFERENT" }],
        veterinarians: [{ ...makeUser({ id: "vet-1" }), role: "VETERINARIAN" }],
        secretaries: [{ ...makeUser({ id: "sec-1" }), role: "SECRETARY" }],
      }),
    );

    const result = await staffService.getStaffByClinicRole({
      authorId: AUTHOR_ID,
      clinicId: CLINIC_ID,
      role: "DIRECTOR",
    });

    expect(result).toHaveLength(4); // director + referent + secretary + veterinarian
  });

  it("avec targetRoles — ne retourne que les rôles demandés", async () => {
    mockClinicService.getClinicByUser.mockResolvedValue([{ id: CLINIC_ID }]);
    mockStaffRepository.findStaff.mockResolvedValue(
      makeClinicStaff({
        veterinarians: [{ ...makeUser({ id: "vet-1" }), role: "VETERINARIAN" }],
        secretaries: [{ ...makeUser({ id: "sec-1" }), role: "SECRETARY" }],
      }),
    );

    const result = await staffService.getStaffByClinicRole({
      authorId: AUTHOR_ID,
      clinicId: CLINIC_ID,
      role: "DIRECTOR",
      targetRoles: ["VETERINARIAN"],
    });

    expect(result).toHaveLength(1);
    expect(result[0].role).toBe("VETERINARIAN");
  });
});

// ── getStaffMemberDetail ──────────────────────────────────────────────────

describe("StaffService.getStaffMemberDetail", () => {
  it("aucune clinique associée — NotFoundError", async () => {
    mockClinicService.getClinicByUser.mockResolvedValue(null);

    await expect(
      staffService.getStaffMemberDetail({
        authorId: AUTHOR_ID,
        memberId: MEMBER_ID,
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("plusieurs cliniques associées — ConflictError", async () => {
    mockClinicService.getClinicByUser.mockResolvedValue([
      { id: CLINIC_ID },
      { id: OTHER_CLINIC_ID },
    ]);

    await expect(
      staffService.getStaffMemberDetail({
        authorId: AUTHOR_ID,
        memberId: MEMBER_ID,
      }),
    ).rejects.toThrow(ConflictError);
  });

  it("membre introuvable — NotFoundError", async () => {
    mockClinicService.getClinicByUser.mockResolvedValue([{ id: CLINIC_ID }]);
    mockStaffRepository.findMemberDetailById.mockResolvedValue(null);

    await expect(
      staffService.getStaffMemberDetail({
        authorId: AUTHOR_ID,
        memberId: MEMBER_ID,
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("membre d'une autre clinique — ForbiddenError", async () => {
    mockClinicService.getClinicByUser.mockResolvedValue([{ id: CLINIC_ID }]);
    mockStaffRepository.findMemberDetailById.mockResolvedValue({
      ...makeUser(),
      password: "secret",
      veterinarianProfile: null,
      secretaryProfile: { clinicId: OTHER_CLINIC_ID },
      directorClinicProfile: null,
      referentClinicProfile: null,
    });

    await expect(
      staffService.getStaffMemberDetail({
        authorId: AUTHOR_ID,
        memberId: MEMBER_ID,
      }),
    ).rejects.toThrow(ForbiddenError);
  });

  it("retourne le membre sans le mot de passe", async () => {
    mockClinicService.getClinicByUser.mockResolvedValue([{ id: CLINIC_ID }]);
    mockStaffRepository.findMemberDetailById.mockResolvedValue({
      ...makeUser(),
      password: "secret",
      veterinarianProfile: null,
      secretaryProfile: { clinicId: CLINIC_ID },
      directorClinicProfile: null,
      referentClinicProfile: null,
    });

    const result = await staffService.getStaffMemberDetail({
      authorId: AUTHOR_ID,
      memberId: MEMBER_ID,
    });

    expect(result).not.toHaveProperty("password");
    expect(result.email).toBe("alice@test.com");
  });

  it("véto multi-cliniques appartenant à la clinique — accès autorisé", async () => {
    mockClinicService.getClinicByUser.mockResolvedValue([{ id: CLINIC_ID }]);
    mockStaffRepository.findMemberDetailById.mockResolvedValue({
      ...makeUser(),
      password: "secret",
      veterinarianProfile: {
        veterinarianClinics: [
          { clinicId: OTHER_CLINIC_ID },
          { clinicId: CLINIC_ID },
        ],
      },
      secretaryProfile: null,
      directorClinicProfile: null,
      referentClinicProfile: null,
    });

    const result = await staffService.getStaffMemberDetail({
      authorId: AUTHOR_ID,
      memberId: MEMBER_ID,
    });

    expect(result).not.toHaveProperty("password");
  });
});

// ── createVeterinarian ────────────────────────────────────────────────────

describe("StaffService.createVeterinarian", () => {
  const baseData = {
    firstname: "Jean",
    lastname: "Martin",
    email: "jean@test.com",
    password: "Password1!",
    licenseNumber: "LIC123",
  };

  it("aucune clinique associée — NotFoundError", async () => {
    mockClinicService.getClinicByUser.mockResolvedValue(null);

    await expect(
      staffService.createVeterinarian({
        authorId: AUTHOR_ID,
        data: baseData as any,
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("plusieurs cliniques associées — ConflictError", async () => {
    mockClinicService.getClinicByUser.mockResolvedValue([
      { id: CLINIC_ID },
      { id: OTHER_CLINIC_ID },
    ]);

    await expect(
      staffService.createVeterinarian({
        authorId: AUTHOR_ID,
        data: baseData as any,
      }),
    ).rejects.toThrow(ConflictError);

    expect(mockStaffRepository.createVeterinarian).not.toHaveBeenCalled();
  });

  it("crée le vétérinaire avec le clinicId résolu et le mot de passe hashé", async () => {
    mockClinicService.getClinicByUser.mockResolvedValue([{ id: CLINIC_ID }]);
    mockStaffRepository.createVeterinarian.mockResolvedValue({
      id: "new-vet",
      ...baseData,
    });

    await staffService.createVeterinarian({
      authorId: AUTHOR_ID,
      data: baseData as any,
    });

    expect(mockStaffRepository.createVeterinarian).toHaveBeenCalledWith({
      clinicId: CLINIC_ID,
      data: baseData,
      hashedPassword: "hashed_password",
    });
  });
});

// ── createSecretary ───────────────────────────────────────────────────────

describe("StaffService.createSecretary", () => {
  const baseData = {
    firstname: "Sophie",
    lastname: "Bernard",
    email: "sophie@test.com",
    password: "Password1!",
  };

  it("aucune clinique associée — NotFoundError", async () => {
    mockClinicService.getClinicByUser.mockResolvedValue(null);

    await expect(
      staffService.createSecretary({
        authorId: AUTHOR_ID,
        data: baseData as any,
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("plusieurs cliniques associées — ConflictError", async () => {
    mockClinicService.getClinicByUser.mockResolvedValue([
      { id: CLINIC_ID },
      { id: OTHER_CLINIC_ID },
    ]);

    await expect(
      staffService.createSecretary({
        authorId: AUTHOR_ID,
        data: baseData as any,
      }),
    ).rejects.toThrow(ConflictError);

    expect(mockStaffRepository.createSecretary).not.toHaveBeenCalled();
  });

  it("crée la secrétaire avec le clinicId résolu et le mot de passe hashé", async () => {
    mockClinicService.getClinicByUser.mockResolvedValue([{ id: CLINIC_ID }]);
    mockStaffRepository.createSecretary.mockResolvedValue({
      id: "new-sec",
      ...baseData,
    });

    await staffService.createSecretary({
      authorId: AUTHOR_ID,
      data: baseData as any,
    });

    expect(mockStaffRepository.createSecretary).toHaveBeenCalledWith({
      clinicId: CLINIC_ID,
      data: baseData,
      hashedPassword: "hashed_password",
    });
  });
});

// ── createReferent ────────────────────────────────────────────────────────

describe("StaffService.createReferent", () => {
  const baseData = {
    firstname: "Marc",
    lastname: "Petit",
    email: "marc@test.com",
    password: "Password1!",
  };

  it("aucune clinique associée — NotFoundError", async () => {
    mockClinicService.getClinicByUser.mockResolvedValue(null);

    await expect(
      staffService.createReferent({
        authorId: AUTHOR_ID,
        data: baseData as any,
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("plusieurs cliniques associées — ConflictError", async () => {
    mockClinicService.getClinicByUser.mockResolvedValue([
      { id: CLINIC_ID },
      { id: OTHER_CLINIC_ID },
    ]);

    await expect(
      staffService.createReferent({
        authorId: AUTHOR_ID,
        data: baseData as any,
      }),
    ).rejects.toThrow(ConflictError);

    expect(mockStaffRepository.createReferent).not.toHaveBeenCalled();
  });

  it("crée le référent avec le clinicId résolu et le mot de passe hashé", async () => {
    mockClinicService.getClinicByUser.mockResolvedValue([{ id: CLINIC_ID }]);
    mockStaffRepository.createReferent.mockResolvedValue({
      id: "new-ref",
      ...baseData,
    });

    await staffService.createReferent({
      authorId: AUTHOR_ID,
      data: baseData as any,
    });

    expect(mockStaffRepository.createReferent).toHaveBeenCalledWith({
      clinicId: CLINIC_ID,
      data: baseData,
      hashedPassword: "hashed_password",
    });
  });
});
