import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  ForbiddenError,
  NotFoundError,
  ConflictError,
  BadRequestError,
} from "@api/errors";
import type { UserId } from "@armali/schemas";

// ── Mocks ─────────────────────────────────────────────────────────────────────

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

vi.mock("../clinic.repository", () => ({
  ClinicRepository: vi.fn(function () {
    return mockClinicRepository;
  }),
}));

const { ClinicRepository } = await import("../clinic.repository");
const { ClinicService } = await import("../clinic.service");

const clinicService = new ClinicService(new ClinicRepository({} as any));

// ── Fixtures ──────────────────────────────────────────────────────────────────

const CLINIC_ID = "11111111-1111-4111-8111-111111111111";
const OTHER_CLINIC_ID = "22222222-2222-4222-8222-222222222222";
const AUTHOR_ID = "33333333-3333-4333-8333-333333333333" as UserId;

const makeClinic = (overrides = {}) => ({
  id: CLINIC_ID,
  name: "Clinique Test",
  address: "1 rue de Paris",
  siret: "12345678901234",
  phone: "0123456789",
  website: "https://clinique.fr",
  description: null,
  openingHours: null,
  ...overrides,
});

beforeEach(() => vi.clearAllMocks());

// ── getClinicByUser ───────────────────────────────────────────────────────────

describe("ClinicService.getClinicByUser", () => {
  it("retourne les cliniques de l'utilisateur", async () => {
    mockClinicRepository.findClinicByUserId.mockResolvedValue([makeClinic()]);

    const result = await clinicService.getClinicByUser(AUTHOR_ID);

    expect(result).toHaveLength(1);
    expect(mockClinicRepository.findClinicByUserId).toHaveBeenCalledWith(
      AUTHOR_ID,
    );
  });

  it("aucune clinique trouvée — NotFoundError", async () => {
    mockClinicRepository.findClinicByUserId.mockResolvedValue(null);

    await expect(clinicService.getClinicByUser(AUTHOR_ID)).rejects.toThrow(
      NotFoundError,
    );
  });

  it("aucune clinique trouvée (undefined) — NotFoundError", async () => {
    mockClinicRepository.findClinicByUserId.mockResolvedValue(undefined);

    await expect(clinicService.getClinicByUser(AUTHOR_ID)).rejects.toThrow(
      NotFoundError,
    );
  });

  it("une clinique nulle dans le tableau — NotFoundError", async () => {
    // findClinicByUserId peut renvoyer (Clinic | null)[] : un directeur/référent
    // sans clinique renvoie [null] plutôt qu'un tableau vide.
    mockClinicRepository.findClinicByUserId.mockResolvedValue([null]);

    await expect(clinicService.getClinicByUser(AUTHOR_ID)).rejects.toThrow(
      NotFoundError,
    );
  });
});

// ── getClientsByClinic ────────────────────────────────────────────────────────

describe("ClinicService.getClientsByClinic", () => {
  it("rôle non-staff — ForbiddenError", async () => {
    await expect(
      clinicService.getClientsByClinic({
        authorId: AUTHOR_ID,
        clinicId: CLINIC_ID as any,
        role: "CLIENT",
      }),
    ).rejects.toThrow(ForbiddenError);

    expect(mockClinicRepository.findClientsById).not.toHaveBeenCalled();
  });

  it("l'acteur n'a pas accès à cette clinique — ForbiddenError", async () => {
    mockClinicRepository.findClinicByUserId.mockResolvedValue([
      makeClinic({ id: OTHER_CLINIC_ID }),
    ]);

    await expect(
      clinicService.getClientsByClinic({
        authorId: AUTHOR_ID,
        clinicId: CLINIC_ID as any,
        role: "DIRECTOR",
      }),
    ).rejects.toThrow(ForbiddenError);

    expect(mockClinicRepository.findClientsById).not.toHaveBeenCalled();
  });

  it("retourne les clients de la clinique", async () => {
    mockClinicRepository.findClinicByUserId.mockResolvedValue([
      makeClinic({ id: CLINIC_ID }),
    ]);
    mockClinicRepository.findClientsById.mockResolvedValue({
      id: CLINIC_ID,
      veterinarianClinics: [],
    });

    const result = await clinicService.getClientsByClinic({
      authorId: AUTHOR_ID,
      clinicId: CLINIC_ID as any,
      role: "DIRECTOR",
    });

    expect(mockClinicRepository.findClientsById).toHaveBeenCalledWith(
      CLINIC_ID,
    );
    expect(result).toEqual({ id: CLINIC_ID, veterinarianClinics: [] });
  });
});

// ── getClinicIdsByUserId ──────────────────────────────────────────────────────

describe("ClinicService.getClinicIdsByUserId", () => {
  it("aucun clinicId trouvé — ForbiddenError", async () => {
    mockClinicRepository.findClinicIdByUser.mockResolvedValue(null);

    await expect(
      clinicService.getClinicIdsByUserId({
        userId: AUTHOR_ID,
        role: "DIRECTOR",
      }),
    ).rejects.toThrow(ForbiddenError);
  });

  it("retourne les clinicIds validés", async () => {
    mockClinicRepository.findClinicIdByUser.mockResolvedValue([CLINIC_ID]);

    const result = await clinicService.getClinicIdsByUserId({
      userId: AUTHOR_ID,
      role: "DIRECTOR",
    });

    expect(result).toEqual([CLINIC_ID]);
    expect(mockClinicRepository.findClinicIdByUser).toHaveBeenCalledWith({
      userId: AUTHOR_ID,
      role: "DIRECTOR",
    });
  });
});

// ── updateClinic ──────────────────────────────────────────────────────────────

describe("ClinicService.updateClinic", () => {
  it("aucun clinicId trouvé pour l'utilisateur — ForbiddenError", async () => {
    mockClinicRepository.findClinicIdByUser.mockResolvedValue(null);

    await expect(
      clinicService.updateClinic({
        userId: AUTHOR_ID,
        role: "REFERENT",
        data: { name: "Nouveau nom" },
      }),
    ).rejects.toThrow(ForbiddenError);

    expect(mockClinicRepository.update).not.toHaveBeenCalled();
  });

  it("plusieurs cliniques associées à l'utilisateur — ConflictError", async () => {
    mockClinicRepository.findClinicIdByUser.mockResolvedValue([
      CLINIC_ID,
      OTHER_CLINIC_ID,
    ]);

    await expect(
      clinicService.updateClinic({
        userId: AUTHOR_ID,
        role: "VETERINARIAN",
        data: { name: "Nouveau nom" },
      }),
    ).rejects.toThrow(ConflictError);

    expect(mockClinicRepository.update).not.toHaveBeenCalled();
  });

  it("met à jour la clinique de l'utilisateur", async () => {
    mockClinicRepository.findClinicIdByUser.mockResolvedValue([CLINIC_ID]);
    mockClinicRepository.update.mockResolvedValue(
      makeClinic({ name: "Nouveau nom" }),
    );

    const result = await clinicService.updateClinic({
      userId: AUTHOR_ID,
      role: "DIRECTOR",
      data: { name: "Nouveau nom" },
    });

    expect(mockClinicRepository.findClinicIdByUser).toHaveBeenCalledWith({
      userId: AUTHOR_ID,
      role: "DIRECTOR",
    });
    expect(mockClinicRepository.update).toHaveBeenCalledWith(CLINIC_ID, {
      name: "Nouveau nom",
    });
    expect(result.name).toBe("Nouveau nom");
  });
});

// ── getClinics ─────────────────────────────────────────────────────────────────

describe("ClinicService.getClinics", () => {
  it("retourne toutes les cliniques", async () => {
    mockClinicRepository.findAll.mockResolvedValue([
      makeClinic(),
      makeClinic({ id: OTHER_CLINIC_ID }),
    ]);

    const result = await clinicService.getClinics();

    expect(result).toHaveLength(2);
    expect(mockClinicRepository.findAll).toHaveBeenCalled();
  });
});

// ── deleteClinic ───────────────────────────────────────────────────────────────

describe("ClinicService.deleteClinic", () => {
  it("clinique introuvable — NotFoundError", async () => {
    mockClinicRepository.findClinicById.mockResolvedValue(null);

    await expect(clinicService.deleteClinic(CLINIC_ID)).rejects.toThrow(
      NotFoundError,
    );
    expect(mockClinicRepository.countClinicDependencies).not.toHaveBeenCalled();
    expect(mockClinicRepository.deleteClinicById).not.toHaveBeenCalled();
  });

  it("clinique avec des commandes en cours — BadRequestError", async () => {
    mockClinicRepository.findClinicById.mockResolvedValue(makeClinic());
    mockClinicRepository.countClinicDependencies.mockResolvedValue({
      orderCount: 2,
      meetingCount: 0,
      appointmentCount: 0,
      medicalHistoryCount: 0,
    });

    await expect(clinicService.deleteClinic(CLINIC_ID)).rejects.toThrow(
      BadRequestError,
    );
    expect(mockClinicRepository.deleteClinicById).not.toHaveBeenCalled();
  });

  it("clinique avec plusieurs types de dépendances — message détaillé", async () => {
    mockClinicRepository.findClinicById.mockResolvedValue(makeClinic());
    mockClinicRepository.countClinicDependencies.mockResolvedValue({
      orderCount: 1,
      meetingCount: 3,
      appointmentCount: 0,
      medicalHistoryCount: 2,
    });

    await expect(clinicService.deleteClinic(CLINIC_ID)).rejects.toThrow(
      /1 commande.*3 réunions internes.*2 entrées d'historique médical/,
    );
    expect(mockClinicRepository.deleteClinicById).not.toHaveBeenCalled();
  });

  it("supprime la clinique sans dépendances", async () => {
    mockClinicRepository.findClinicById.mockResolvedValue(makeClinic());
    mockClinicRepository.countClinicDependencies.mockResolvedValue({
      orderCount: 0,
      meetingCount: 0,
      appointmentCount: 0,
      medicalHistoryCount: 0,
    });
    mockClinicRepository.deleteClinicById.mockResolvedValue(undefined);

    const result = await clinicService.deleteClinic(CLINIC_ID);

    expect(mockClinicRepository.findClinicById).toHaveBeenCalledWith(CLINIC_ID);
    expect(mockClinicRepository.deleteClinicById).toHaveBeenCalledWith(
      CLINIC_ID,
    );
    expect(result).toEqual({ message: "Clinique supprimée" });
  });
});
