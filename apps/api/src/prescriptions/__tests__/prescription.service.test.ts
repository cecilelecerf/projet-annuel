import { describe, it, expect, vi, beforeEach } from "vitest";
import { NotFoundError, ForbiddenError } from "@api/errors";
import type { UserRole } from "@armali/schemas";

const mockRepository = vi.hoisted(() => ({
  findByMeeting: vi.fn(),
  findById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
}));

vi.mock("../prescription.repository", () => ({
  PrescriptionRepository: vi.fn(function () {
    return mockRepository;
  }),
}));

const { PrescriptionRepository } = await import("../prescription.repository");
const { PrescriptionService } = await import("../prescription.service");

const service = new PrescriptionService(new PrescriptionRepository({} as any));

beforeEach(() => vi.clearAllMocks());

const ALLOWED_ROLES: UserRole[] = ["VETERINARIAN"];
const FORBIDDEN_ROLES: UserRole[] = [
  "ADMIN",
  "DIRECTOR",
  "REFERENT",
  "SECRETARY",
  "CLIENT",
];

const makePrescription = (overrides = {}) => ({
  id: "prescription-1",
  startDate: new Date("2026-01-01"),
  endDate: new Date("2026-01-15"),
  status: "ACTIVE",
  notes: "À prendre après les repas",
  animalMeetingId: "animal-meeting-1",
  veterinarianId: "vet-1",
  items: [
    {
      medicationName: "Amoxicilline",
      dosage: "250mg",
      frequency: "2x/jour",
      duration: "10 jours",
      instructions: null,
      clinicProductId: null,
    },
  ],
  ...overrides,
});

const makeCreateData = (overrides = {}) => ({
  startDate: new Date("2026-01-01"),
  endDate: new Date("2026-01-15"),
  status: "ACTIVE",
  notes: "À prendre après les repas",
  animalMeetingId: "animal-meeting-1",
  veterinarianId: "vet-1",
  items: [
    {
      medicationName: "Amoxicilline",
      dosage: "250mg",
      frequency: "2x/jour",
      duration: "10 jours",
      instructions: null,
      clinicProductId: null,
    },
  ],
  ...overrides,
});

// ── getByMeeting ─────────────────────────────────────────────────────────────

describe("PrescriptionService.getByMeeting", () => {
  it("délègue au repository avec le meetingId, sans vérification de rôle", async () => {
    mockRepository.findByMeeting.mockResolvedValue([makePrescription()]);

    const result = await service.getByMeeting("meeting-1" as any);

    expect(mockRepository.findByMeeting).toHaveBeenCalledWith("meeting-1");
    expect(result).toHaveLength(1);
  });

  it("retourne un tableau vide si aucune prescription", async () => {
    mockRepository.findByMeeting.mockResolvedValue([]);

    const result = await service.getByMeeting("meeting-1" as any);

    expect(result).toHaveLength(0);
  });
});

// ── getById ──────────────────────────────────────────────────────────────────

describe("PrescriptionService.getById", () => {
  it("retourne la prescription trouvée", async () => {
    mockRepository.findById.mockResolvedValue(makePrescription());

    const result = await service.getById("prescription-1");

    expect(result.id).toBe("prescription-1");
  });

  it("lève NotFoundError si absente", async () => {
    mockRepository.findById.mockResolvedValue(null);

    await expect(service.getById("unknown")).rejects.toThrow(NotFoundError);
  });
});

// ── create ───────────────────────────────────────────────────────────────────

describe("PrescriptionService.create", () => {
  const data = makeCreateData() as any;

  it("VETERINARIAN crée la prescription", async () => {
    mockRepository.create.mockResolvedValue(makePrescription());

    const result = await service.create(data, "VETERINARIAN");

    expect(mockRepository.create).toHaveBeenCalledWith(data);
    expect(result.id).toBe("prescription-1");
  });

  it.each(FORBIDDEN_ROLES)(
    "%s — ForbiddenError, aucune création",
    async (role) => {
      await expect(service.create(data, role)).rejects.toThrow(ForbiddenError);
      expect(mockRepository.create).not.toHaveBeenCalled();
    },
  );
});

// ── update ───────────────────────────────────────────────────────────────────

describe("PrescriptionService.update", () => {
  const data = { notes: "Notes modifiées" } as any;

  it.each(FORBIDDEN_ROLES)(
    "%s — ForbiddenError avant toute lecture",
    async (role) => {
      await expect(
        service.update("prescription-1", data, role),
      ).rejects.toThrow(ForbiddenError);
      expect(mockRepository.findById).not.toHaveBeenCalled();
    },
  );

  it("prescription introuvable — NotFoundError", async () => {
    mockRepository.findById.mockResolvedValue(null);

    await expect(
      service.update("unknown", data, "VETERINARIAN"),
    ).rejects.toThrow(NotFoundError);
    expect(mockRepository.update).not.toHaveBeenCalled();
  });

  it("VETERINARIAN met à jour la prescription", async () => {
    mockRepository.findById.mockResolvedValue(makePrescription());
    mockRepository.update.mockResolvedValue(
      makePrescription({ notes: "Notes modifiées" }),
    );

    const result = await service.update("prescription-1", data, "VETERINARIAN");

    expect(mockRepository.update).toHaveBeenCalledWith("prescription-1", data);
    expect(result.notes).toBe("Notes modifiées");
  });
});

// ── delete ───────────────────────────────────────────────────────────────────

describe("PrescriptionService.delete", () => {
  it.each(FORBIDDEN_ROLES)(
    "%s — ForbiddenError avant toute lecture",
    async (role) => {
      await expect(service.delete("prescription-1", role)).rejects.toThrow(
        ForbiddenError,
      );
      expect(mockRepository.findById).not.toHaveBeenCalled();
    },
  );

  it("prescription introuvable — NotFoundError", async () => {
    mockRepository.findById.mockResolvedValue(null);

    await expect(service.delete("unknown", "VETERINARIAN")).rejects.toThrow(
      NotFoundError,
    );
    expect(mockRepository.delete).not.toHaveBeenCalled();
  });

  it("VETERINARIAN supprime la prescription", async () => {
    mockRepository.findById.mockResolvedValue(makePrescription());
    mockRepository.delete.mockResolvedValue(undefined);

    await service.delete("prescription-1", "VETERINARIAN");

    expect(mockRepository.delete).toHaveBeenCalledWith("prescription-1");
  });
});
