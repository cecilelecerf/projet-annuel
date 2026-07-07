import { describe, it, expect, vi, beforeEach } from "vitest";
import { ForbiddenError, NotFoundError, BadRequestError } from "@api/errors";

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockRepository = vi.hoisted(() => ({
  findById: vi.fn(),
  findByMeeting: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
}));

const mockAnimalMeetingRepository = vi.hoisted(() => ({
  findById: vi.fn(),
}));

const mockClinicActRepository = vi.hoisted(() => ({
  findById: vi.fn(),
}));

const mockVeterinarianClinicRepository = vi.hoisted(() => ({
  findById: vi.fn(),
  findByVeterinarianAndClinic: vi.fn(),
}));

const mockAnimalRepository = vi.hoisted(() => ({
  findById: vi.fn(),
}));

const mockVaccineRepository = vi.hoisted(() => ({
  findById: vi.fn(),
}));

vi.mock("@api/medicalHistories/medical-history.repository", () => ({
  AnimalMedicalHistoryRepository: vi.fn(function () {
    return mockRepository;
  }),
}));

vi.mock("@api/meetings/animal-meeting/animal-meeting.repository", () => ({
  AnimalMeetingRepository: vi.fn(function () {
    return mockAnimalMeetingRepository;
  }),
}));

vi.mock("@api/acts/clinic-act.repository", () => ({
  ClinicActRepository: vi.fn(function () {
    return mockClinicActRepository;
  }),
}));

vi.mock(
  "@api/clinics/veterinarian-clinics/veterinarian-clinic.repository",
  () => ({
    VeterinarianClinicRepository: vi.fn(function () {
      return mockVeterinarianClinicRepository;
    }),
  }),
);

vi.mock("@api/animals/animal.repository", () => ({
  AnimalRepository: vi.fn(function () {
    return mockAnimalRepository;
  }),
}));

vi.mock("@api/vaccines/vaccine.repository", () => ({
  VaccineRepository: vi.fn(function () {
    return mockVaccineRepository;
  }),
}));

const { AnimalMedicalHistoryService } =
  await import("@api/medicalHistories/medical-history.service");
const { AnimalMedicalHistoryRepository } =
  await import("@api/medicalHistories/medical-history.repository");
const { AnimalMeetingRepository } =
  await import("@api/meetings/animal-meeting/animal-meeting.repository");
const { AnimalRepository } = await import("@api/animals/animal.repository");
const { VaccineRepository } = await import("@api/vaccines/vaccine.repository");
const { VeterinarianClinicRepository } =
  await import("@api/veterinarian-clinics/veterinarian-clinic.repository");
const { ClinicActRepository } = await import("@api/acts/clinic-act.repository");

const service = new AnimalMedicalHistoryService(
  new AnimalMedicalHistoryRepository({} as any),
  new AnimalMeetingRepository({} as any),
  new AnimalRepository({} as any),
  new VaccineRepository({} as any),
  new VeterinarianClinicRepository({} as any),
  new ClinicActRepository({} as any),
);

// ── Fixtures ──────────────────────────────────────────────────────────────────

const makeAnimalMeeting = (overrides = {}) => ({
  id: "animal-meeting-1",
  animalId: "animal-1",
  veterinarianClinicId: "vet-clinic-1",
  meeting: { date: new Date("2026-06-01T10:00:00.000Z") },
  ...overrides,
});

const makeClinicAct = (overrides = {}) => ({
  id: "clinic-act-1",
  actId: "act-1",
  clinicId: "clinic-1",
  price: { toNumber: () => 50 },
  act: { type: "CONSULTATION" },
  ...overrides,
});

const makeVeterinarianClinic = (overrides = {}) => ({
  id: "vet-clinic-1",
  clinicId: "clinic-1",
  veterinarianId: "veto-1",
  ...overrides,
});

const makeAnimal = (overrides = {}) => ({
  id: "animal-1",
  clientId: "client-profile-1",
  race: { petId: "pet-1" },
  ...overrides,
});

const makeVaccine = (overrides = {}) => ({
  id: "vaccine-1",
  petId: "pet-1",
  ...overrides,
});

const makeHistory = (overrides = {}) => ({
  id: "history-1",
  type: "CONSULTATION",
  performedAt: new Date(),
  animalId: "animal-1",
  actId: "act-1",
  ...overrides,
});

const makeValidCreateData = (overrides = {}) => ({
  meetingId: "meeting-base-1",
  clinicActId: "clinic-act-1",
  analysis: { analysisType: "BLOOD", status: "PENDING" },
  ...overrides,
});

beforeEach(() => vi.clearAllMocks());

// ── getById ───────────────────────────────────────────────────────────────────

describe("AnimalMedicalHistoryService.getById", () => {
  it("acte introuvable — NotFoundError", async () => {
    mockRepository.findById.mockResolvedValue(null);

    await expect(service.getById("unknown")).rejects.toThrow(NotFoundError);
  });

  it("retourne l'acte", async () => {
    const history = makeHistory();
    mockRepository.findById.mockResolvedValue(history);

    const result = await service.getById("history-1");

    expect(result).toEqual(history);
  });
});

// ── getByMeeting ──────────────────────────────────────────────────────────────

describe("AnimalMedicalHistoryService.getByMeeting", () => {
  it("retourne les actes du meeting", async () => {
    mockRepository.findByMeeting.mockResolvedValue([makeHistory()]);

    const result = await service.getByMeeting("meeting-1");

    expect(result).toHaveLength(1);
  });

  it("retourne un tableau vide si aucun acte", async () => {
    mockRepository.findByMeeting.mockResolvedValue([]);

    const result = await service.getByMeeting("meeting-1");

    expect(result).toHaveLength(0);
  });
});

// ── create ────────────────────────────────────────────────────────────────────

describe("AnimalMedicalHistoryService.create", () => {
  it("CLIENT — ForbiddenError", async () => {
    await expect(
      service.create(makeValidCreateData() as any, "CLIENT", "user-1"),
    ).rejects.toThrow(ForbiddenError);
  });

  it("animalMeeting introuvable — NotFoundError", async () => {
    mockAnimalMeetingRepository.findById.mockResolvedValue(null);

    await expect(
      service.create(makeValidCreateData() as any, "VETERINARIAN", "user-1"),
    ).rejects.toThrow(NotFoundError);
  });

  it("STAFF sans clinicActId — BadRequestError", async () => {
    mockAnimalMeetingRepository.findById.mockResolvedValue(makeAnimalMeeting());

    await expect(
      service.create(
        makeValidCreateData({ clinicActId: undefined }) as any,
        "VETERINARIAN",
        "user-1",
      ),
    ).rejects.toThrow(BadRequestError);
  });

  it("clinicAct introuvable — NotFoundError", async () => {
    mockAnimalMeetingRepository.findById.mockResolvedValue(makeAnimalMeeting());
    mockClinicActRepository.findById.mockResolvedValue(null);

    await expect(
      service.create(makeValidCreateData() as any, "VETERINARIAN", "user-1"),
    ).rejects.toThrow(NotFoundError);
  });

  it("veterinarianClinic introuvable — NotFoundError", async () => {
    mockAnimalMeetingRepository.findById.mockResolvedValue(makeAnimalMeeting());
    mockClinicActRepository.findById.mockResolvedValue(makeClinicAct());
    mockVeterinarianClinicRepository.findById.mockResolvedValue(null);

    await expect(
      service.create(makeValidCreateData() as any, "VETERINARIAN", "user-1"),
    ).rejects.toThrow(NotFoundError);
  });

  it("clinique du meeting différente du clinicAct — BadRequestError", async () => {
    mockAnimalMeetingRepository.findById.mockResolvedValue(makeAnimalMeeting());
    mockClinicActRepository.findById.mockResolvedValue(makeClinicAct());
    mockVeterinarianClinicRepository.findById.mockResolvedValue(
      makeVeterinarianClinic({ clinicId: "autre-clinic" }),
    );

    await expect(
      service.create(makeValidCreateData() as any, "VETERINARIAN", "user-1"),
    ).rejects.toThrow(BadRequestError);
  });

  it("vaccin ne correspond pas à l'espèce — BadRequestError", async () => {
    mockAnimalMeetingRepository.findById.mockResolvedValue(makeAnimalMeeting());
    mockClinicActRepository.findById.mockResolvedValue(makeClinicAct());
    mockVeterinarianClinicRepository.findById.mockResolvedValue(
      makeVeterinarianClinic(),
    );
    mockAnimalRepository.findById.mockResolvedValue(makeAnimal());
    mockVaccineRepository.findById.mockResolvedValue(
      makeVaccine({ petId: "autre-pet" }),
    );

    await expect(
      service.create(
        makeValidCreateData({
          vaccination: { vaccineId: "vaccine-1" },
        }) as any,
        "VETERINARIAN",
        "user-1",
      ),
    ).rejects.toThrow(BadRequestError);
  });

  it("crée un acte avec succès", async () => {
    const history = makeHistory();
    mockAnimalMeetingRepository.findById.mockResolvedValue(makeAnimalMeeting());
    mockClinicActRepository.findById.mockResolvedValue(makeClinicAct());
    mockVeterinarianClinicRepository.findById.mockResolvedValue(
      makeVeterinarianClinic(),
    );
    mockRepository.create.mockResolvedValue(history);

    const result = await service.create(
      makeValidCreateData() as any,
      "VETERINARIAN",
      "user-1",
    );

    expect(mockRepository.create).toHaveBeenCalledOnce();
    expect(result).toEqual(history);
  });

  it("priceApplied fallback sur clinicAct.price", async () => {
    const clinicAct = makeClinicAct();
    mockAnimalMeetingRepository.findById.mockResolvedValue(makeAnimalMeeting());
    mockClinicActRepository.findById.mockResolvedValue(clinicAct);
    mockVeterinarianClinicRepository.findById.mockResolvedValue(
      makeVeterinarianClinic(),
    );
    mockRepository.create.mockResolvedValue(makeHistory());

    await service.create(
      makeValidCreateData({ priceApplied: undefined }) as any,
      "VETERINARIAN",
      "user-1",
    );

    expect(mockRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        priceApplied: clinicAct.price,
      }),
    );
  });

  it("performedBy filtrés par clinique", async () => {
    mockAnimalMeetingRepository.findById.mockResolvedValue(makeAnimalMeeting());
    mockClinicActRepository.findById.mockResolvedValue(makeClinicAct());
    mockVeterinarianClinicRepository.findById.mockResolvedValue(
      makeVeterinarianClinic(),
    );
    mockVeterinarianClinicRepository.findByVeterinarianAndClinic
      .mockResolvedValueOnce({ id: "vc-1" })
      .mockResolvedValueOnce(null);
    mockRepository.create.mockResolvedValue(makeHistory());

    await service.create(
      makeValidCreateData({
        performedByIds: [{ id: "veto-1" }, { id: "veto-2" }],
      }) as any,
      "VETERINARIAN",
      "user-1",
    );

    expect(mockRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        performedBy: ["vc-1"],
      }),
    );
  });
});

// ── update ────────────────────────────────────────────────────────────────────

describe("AnimalMedicalHistoryService.update", () => {
  it("CLIENT — ForbiddenError", async () => {
    await expect(
      service.update("history-1", {} as any, "CLIENT"),
    ).rejects.toThrow(ForbiddenError);
  });

  it("acte introuvable — NotFoundError", async () => {
    mockRepository.findById.mockResolvedValue(null);

    await expect(
      service.update("unknown", {} as any, "VETERINARIAN"),
    ).rejects.toThrow(NotFoundError);
  });

  it("met à jour l'acte", async () => {
    mockRepository.findById.mockResolvedValue(makeHistory());
    mockRepository.update.mockResolvedValue(makeHistory({ notes: "Nouveau" }));

    const result = await service.update(
      "history-1",
      { notes: "Nouveau" } as any,
      "VETERINARIAN",
    );

    expect(mockRepository.update).toHaveBeenCalledWith(
      "history-1",
      expect.objectContaining({ notes: "Nouveau" }),
    );
    expect(result).toHaveProperty("notes", "Nouveau");
  });
});

// ── delete ────────────────────────────────────────────────────────────────────

describe("AnimalMedicalHistoryService.delete", () => {
  it("CLIENT — ForbiddenError", async () => {
    await expect(service.delete("history-1", "CLIENT")).rejects.toThrow(
      ForbiddenError,
    );
  });

  it("acte introuvable — NotFoundError", async () => {
    mockRepository.findById.mockResolvedValue(null);

    await expect(service.delete("unknown", "VETERINARIAN")).rejects.toThrow(
      NotFoundError,
    );
  });

  it("supprime l'acte", async () => {
    mockRepository.findById.mockResolvedValue(makeHistory());
    mockRepository.delete.mockResolvedValue(undefined);

    await service.delete("history-1", "VETERINARIAN");

    expect(mockRepository.delete).toHaveBeenCalledWith("history-1");
  });
});
