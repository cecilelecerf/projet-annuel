import { describe, it, expect, vi, beforeEach } from "vitest";
import { NotFoundError, ForbiddenError, ConflictError } from "@api/errors";
import { ClinicActId, UserId, UserRole } from "@armali/schemas";
const CLINIC_ID = "11111111-1111-4111-8111-111111111111";
const ACT_ID = "22222222-2222-4222-8222-222222222222";
const mockClinicActRepository = vi.hoisted(() => ({
  findByClinic: vi.fn(),
  findById: vi.fn(),
  findByKeys: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
}));

const mockClinicRepository = vi.hoisted(() => ({
  findAll: vi.fn(),
  findClinicByUserId: vi.fn(),
  findClinicIdByUser: vi.fn(),
  findClientsById: vi.fn(),
  findDirectorProfile: vi.fn(),
  findClinicById: vi.fn(),
  countClinicDependencies: vi.fn(),
  deleteClinicById: vi.fn(),
  update: vi.fn(),
}));

vi.mock("../clinic-act.repository", () => ({
  ClinicActRepository: vi.fn(function () {
    return mockClinicActRepository;
  }),
}));

vi.mock("@api/clinics/clinic.repository", () => ({
  ClinicRepository: vi.fn(function () {
    return mockClinicRepository;
  }),
}));

const { ClinicRepository } = await import("@api/clinics/clinic.repository");
const { ClinicService } = await import("@api/clinics/clinic.service");
const { ClinicActRepository } = await import("../clinic-act.repository");
const { ClinicActService } = await import("../clinic-act.service");

const service = new ClinicActService(
  new ClinicActRepository({} as any),
  new ClinicService(new ClinicRepository({} as any)),
);

beforeEach(() => vi.clearAllMocks());

const makeClinicAct = (overrides = {}) => ({
  id: "clinic-act-1",
  actId: ACT_ID,
  clinicId: CLINIC_ID,
  price: 50,
  ...overrides,
});

// Contrat de rôles pour createClinicAct/updateClinicAct/deleteClinicAct :
// autorisé = DIRECTOR, REFERENT / refusé = SECRETARY, VETERINARIAN, CLIENT, ADMIN
const ALLOWED_ROLES: UserRole[] = ["DIRECTOR", "REFERENT"];
const FORBIDDEN_ROLES: UserRole[] = [
  "SECRETARY",
  "VETERINARIAN",
  "CLIENT",
  "ADMIN",
];

// ── getClinicActs ────────────────────────────────────────────────────────────
// NOTE: méthode non exposée par le router actuellement (aucune route ne
// l'appelle) — testée ici en isolation uniquement.

describe("ClinicActService.getClinicActs", () => {
  it("délègue au repository avec le clinicId", async () => {
    mockClinicActRepository.findByClinic.mockResolvedValue([makeClinicAct()]);

    const result = await service.getClinicActs(CLINIC_ID);

    expect(mockClinicActRepository.findByClinic).toHaveBeenCalledWith(
      CLINIC_ID,
    );
    expect(result).toHaveLength(1);
  });
});

// ── getClinicActById ─────────────────────────────────────────────────────────

describe("ClinicActService.getClinicActById", () => {
  it("retourne le clinicAct trouvé", async () => {
    mockClinicActRepository.findById.mockResolvedValue(makeClinicAct());

    const result = await service.getClinicActById("clinic-act-1");

    expect(result.id).toBe("clinic-act-1");
  });

  it("lève NotFoundError si absent", async () => {
    mockClinicActRepository.findById.mockResolvedValue(null);

    await expect(service.getClinicActById("unknown")).rejects.toThrow(
      NotFoundError,
    );
  });
});

// ── createClinicAct ──────────────────────────────────────────────────────────

describe("ClinicActService.createClinicAct", () => {
  const data = { actId: ACT_ID, price: 50 } as any;
  const userId = "user-1" as UserId;

  it.each(ALLOWED_ROLES)("%s peut créer un clinicAct", async (role) => {
    mockClinicRepository.findClinicIdByUser.mockResolvedValue([CLINIC_ID]);
    mockClinicActRepository.findByKeys.mockResolvedValue(null);
    mockClinicActRepository.create.mockResolvedValue(makeClinicAct(data));

    const result = await service.createClinicAct(data, role, userId);

    expect(mockClinicRepository.findClinicIdByUser).toHaveBeenCalledWith({
      userId,
      role,
    });
    expect(mockClinicActRepository.findByKeys).toHaveBeenCalledWith(
      CLINIC_ID,
      ACT_ID,
    );
    expect(mockClinicActRepository.create).toHaveBeenCalledWith(
      CLINIC_ID,
      data,
    );
    expect(result).toBeDefined();
  });

  it.each(FORBIDDEN_ROLES)(
    "%s — ForbiddenError, aucune résolution de clinique ni création",
    async (role) => {
      await expect(service.createClinicAct(data, role, userId)).rejects.toThrow(
        ForbiddenError,
      );
      expect(mockClinicRepository.findClinicIdByUser).not.toHaveBeenCalled();
      expect(mockClinicActRepository.create).not.toHaveBeenCalled();
    },
  );

  it("ConflictError si le clinicAct existe déjà (détecté via findByKeys)", async () => {
    mockClinicRepository.findClinicIdByUser.mockResolvedValue([CLINIC_ID]);
    mockClinicActRepository.findByKeys.mockResolvedValue(makeClinicAct());

    await expect(
      service.createClinicAct(data, "DIRECTOR", userId),
    ).rejects.toThrow(ConflictError);
    expect(mockClinicActRepository.create).not.toHaveBeenCalled();
  });
});

// ── updateClinicAct ──────────────────────────────────────────────────────────

describe("ClinicActService.updateClinicAct", () => {
  it.each(FORBIDDEN_ROLES)(
    "%s — ForbiddenError avant toute lecture",
    async (role) => {
      await expect(
        service.updateClinicAct("clinic-act-1", { price: 60 } as any, role),
      ).rejects.toThrow(ForbiddenError);
      expect(mockClinicActRepository.findById).not.toHaveBeenCalled();
    },
  );

  it("clinicAct introuvable — NotFoundError", async () => {
    mockClinicActRepository.findById.mockResolvedValue(null);

    await expect(
      service.updateClinicAct("unknown", { price: 60 } as any, "REFERENT"),
    ).rejects.toThrow(NotFoundError);
  });

  it.each(ALLOWED_ROLES)("%s met à jour le clinicAct", async (role) => {
    mockClinicActRepository.findById.mockResolvedValue(makeClinicAct());
    mockClinicActRepository.update.mockResolvedValue(
      makeClinicAct({ price: 60 }),
    );

    const result = await service.updateClinicAct(
      "clinic-act-1",
      { price: 60 } as any,
      role,
    );

    expect(mockClinicActRepository.update).toHaveBeenCalledWith(
      "clinic-act-1",
      {
        price: 60,
      },
    );
    expect(result.price).toBe(60);
  });
});

// ── deleteClinicAct ──────────────────────────────────────────────────────────

describe("ClinicActService.deleteClinicAct", () => {
  it.each(FORBIDDEN_ROLES)(
    "%s — ForbiddenError avant toute lecture",
    async (role) => {
      await expect(
        service.deleteClinicAct("clinic-act-1" as ClinicActId, role),
      ).rejects.toThrow(ForbiddenError);
      expect(mockClinicActRepository.findById).not.toHaveBeenCalled();
    },
  );

  it("clinicAct introuvable — NotFoundError", async () => {
    mockClinicActRepository.findById.mockResolvedValue(null);

    await expect(
      service.deleteClinicAct("unknown" as ClinicActId, "DIRECTOR"),
    ).rejects.toThrow(NotFoundError);
    expect(mockClinicActRepository.delete).not.toHaveBeenCalled();
  });

  it.each(ALLOWED_ROLES)("%s supprime le clinicAct", async (role) => {
    mockClinicActRepository.findById.mockResolvedValue(makeClinicAct());
    mockClinicActRepository.delete.mockResolvedValue(undefined);

    await service.deleteClinicAct("clinic-act-1" as ClinicActId, role);

    expect(mockClinicActRepository.delete).toHaveBeenCalledWith("clinic-act-1");
  });
});
