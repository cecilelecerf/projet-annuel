import { describe, it, expect, vi, beforeEach } from "vitest";
import { ForbiddenError, NotFoundError, BadRequestError } from "@api/errors";
import { AnimalId } from "@armali/schemas";

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockRepository = vi.hoisted(() => ({
  findById: vi.fn(),
  findByMeeting: vi.fn(),
  findByClinic: vi.fn(),
  findByAnimalId: vi.fn(),
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

const mockActRepository = vi.hoisted(() => ({
  findById: vi.fn(),
}));

const mockFileService = vi.hoisted(() => ({
  getByEntity: vi.fn(),
  createUpload: vi.fn(),
  confirmUpload: vi.fn(),
}));

vi.mock("@api/medical-histories/medical-history.repository", () => ({
  AnimalMedicalHistoryRepository: vi.fn(function () {
    return mockRepository;
  }),
}));

vi.mock("@api/meetings/animal-meeting/animal-meeting.repository", () => ({
  AnimalMeetingRepository: vi.fn(function () {
    return mockAnimalMeetingRepository;
  }),
}));

vi.mock("@api/clinic-acts/clinic-act.repository", () => ({
  ClinicActRepository: vi.fn(function () {
    return mockClinicActRepository;
  }),
}));

vi.mock("@api/veterinarian-clinics/veterinarian-clinic.repository", () => ({
  VeterinarianClinicRepository: vi.fn(function () {
    return mockVeterinarianClinicRepository;
  }),
}));

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

vi.mock("@api/acts/act.repository", () => ({
  ActRepository: vi.fn(function () {
    return mockActRepository;
  }),
}));

vi.mock("@api/files/file.service", () => ({
  FileService: vi.fn(function () {
    return mockFileService;
  }),
}));

const { AnimalMedicalHistoryService } =
  await import("@api/medical-histories/medical-history.service");
const { AnimalMedicalHistoryRepository } =
  await import("@api/medical-histories/medical-history.repository");
const { AnimalMeetingRepository } =
  await import("@api/meetings/animal-meeting/animal-meeting.repository");
const { AnimalRepository } = await import("@api/animals/animal.repository");
const { VaccineRepository } = await import("@api/vaccines/vaccine.repository");
const { VeterinarianClinicRepository } =
  await import("@api/veterinarian-clinics/veterinarian-clinic.repository");
const { ClinicActRepository } =
  await import("@api/clinic-acts/clinic-act.repository");
const { ActRepository } = await import("@api/acts/act.repository");
const { FileService } = await import("@api/files/file.service");

const service = new AnimalMedicalHistoryService(
  new AnimalMedicalHistoryRepository({} as any),
  new AnimalMeetingRepository({} as any),
  new AnimalRepository({} as any),
  new ActRepository({} as any),
  new VaccineRepository({} as any),
  new VeterinarianClinicRepository({} as any),
  new ClinicActRepository({} as any),
  new FileService({} as any),
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
  price: 50,
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
  attendingVeterinarianClinic: null,
  ...overrides,
});

const makeVaccine = (overrides = {}) => ({
  id: "vaccine-1",
  petId: "pet-1",
  ...overrides,
});

const makeAct = (overrides = {}) => ({
  id: "act-1",
  type: "CONSULTATION",
  ...overrides,
});

const makeHistory = (overrides = {}) => ({
  id: "history-1",
  type: "CONSULTATION",
  performedAt: new Date(),
  animalId: "animal-1",
  actId: "act-1",
  animalMeetingId: null,
  clinicActId: null,
  imaging: null,
  analysis: null,
  performedBy: null,
  ...overrides,
});

const makeFreeCreateData = (overrides = {}) => ({
  type: "free" as const,
  animalId: "animal-1",
  actId: "act-1",
  performedAt: new Date("2026-06-01"),
  ...overrides,
});

const makeMeetingCreateData = (overrides = {}) => ({
  type: "meeting" as const,
  animalMeetingId: "animal-meeting-1",
  clinicActId: "clinic-act-1",
  ...overrides,
});

beforeEach(() => {
  vi.clearAllMocks();
  // Par défaut, staff appartient à sa clinique — les tests "hors clinique"
  // surchargent explicitement avec mockResolvedValue(null).
  mockVeterinarianClinicRepository.findByVeterinarianAndClinic.mockResolvedValue(
    { id: "vet-clinic-1" },
  );
});

// ── create — dispatch ─────────────────────────────────────────────────────────

describe("AnimalMedicalHistoryService.create — dispatch", () => {
  it("rôle non autorisé (DIRECTOR) — ForbiddenError avant tout dispatch", async () => {
    await expect(
      service.create(makeFreeCreateData() as any, "DIRECTOR", "user-1"),
    ).rejects.toThrow(ForbiddenError);
  });

  it("type=free — délègue à createFree", async () => {
    mockActRepository.findById.mockResolvedValue(makeAct());
    mockAnimalRepository.findById.mockResolvedValue(
      makeAnimal({ clientId: "user-1" }),
    );
    mockRepository.create.mockResolvedValue(makeHistory());

    await service.create(makeFreeCreateData() as any, "CLIENT", "user-1");

    expect(mockAnimalMeetingRepository.findById).not.toHaveBeenCalled();
    expect(mockRepository.create).toHaveBeenCalledOnce();
  });

  it("type=meeting — délègue à createFromMeeting", async () => {
    mockAnimalMeetingRepository.findById.mockResolvedValue(makeAnimalMeeting());
    mockClinicActRepository.findById.mockResolvedValue(makeClinicAct());
    mockVeterinarianClinicRepository.findById.mockResolvedValue(
      makeVeterinarianClinic(),
    );
    mockRepository.create.mockResolvedValue(makeHistory());

    await service.create(
      makeMeetingCreateData() as any,
      "VETERINARIAN",
      "user-1",
    );

    expect(mockAnimalMeetingRepository.findById).toHaveBeenCalledOnce();
    expect(mockRepository.create).toHaveBeenCalledOnce();
  });
});

// ── createFree ────────────────────────────────────────────────────────────────

describe("AnimalMedicalHistoryService.create — flow libre", () => {
  it("actId manquant — BadRequestError", async () => {
    await expect(
      service.create(
        makeFreeCreateData({ actId: undefined }) as any,
        "CLIENT",
        "user-1",
      ),
    ).rejects.toThrow(BadRequestError);
  });

  it("acte introuvable — NotFoundError", async () => {
    mockActRepository.findById.mockResolvedValue(null);
    await expect(
      service.create(makeFreeCreateData() as any, "CLIENT", "user-1"),
    ).rejects.toThrow(NotFoundError);
  });

  it("animal introuvable — NotFoundError", async () => {
    mockActRepository.findById.mockResolvedValue(makeAct());
    mockAnimalRepository.findById.mockResolvedValue(null);
    await expect(
      service.create(makeFreeCreateData() as any, "CLIENT", "user-1"),
    ).rejects.toThrow(NotFoundError);
  });

  it("CLIENT sur l'animal d'un autre — ForbiddenError", async () => {
    mockActRepository.findById.mockResolvedValue(makeAct());
    mockAnimalRepository.findById.mockResolvedValue(
      makeAnimal({ clientId: "autre-client" }),
    );
    await expect(
      service.create(makeFreeCreateData() as any, "CLIENT", "user-1"),
    ).rejects.toThrow(ForbiddenError);
  });

  it("staff avec animal sans clinique de suivi — ignore le check clinique, succès", async () => {
    // isStaff(VETERINARIAN) === true, mais animal.attendingVeterinarianClinic
    // est null → le `if (isStaff(role) && animal.attendingVeterinarianClinic)`
    // ne s'exécute pas, aucune vérification de clinique n'est faite.
    mockActRepository.findById.mockResolvedValue(makeAct());
    mockAnimalRepository.findById.mockResolvedValue(
      makeAnimal({ attendingVeterinarianClinic: null }),
    );
    mockRepository.create.mockResolvedValue(makeHistory());

    await service.create(makeFreeCreateData() as any, "VETERINARIAN", "user-1");

    expect(
      mockVeterinarianClinicRepository.findByVeterinarianAndClinic,
    ).not.toHaveBeenCalled();
    expect(mockRepository.create).toHaveBeenCalledOnce();
  });

  it("staff hors de la clinique suivant l'animal — ForbiddenError", async () => {
    mockActRepository.findById.mockResolvedValue(makeAct());
    mockAnimalRepository.findById.mockResolvedValue(
      makeAnimal({ attendingVeterinarianClinic: { clinicId: "clinic-1" } }),
    );
    mockVeterinarianClinicRepository.findByVeterinarianAndClinic.mockResolvedValue(
      null,
    );

    await expect(
      service.create(makeFreeCreateData() as any, "VETERINARIAN", "user-1"),
    ).rejects.toThrow(ForbiddenError);
  });

  it("staff dans la bonne clinique — succès", async () => {
    mockActRepository.findById.mockResolvedValue(makeAct());
    mockAnimalRepository.findById.mockResolvedValue(
      makeAnimal({ attendingVeterinarianClinic: { clinicId: "clinic-1" } }),
    );
    mockRepository.create.mockResolvedValue(makeHistory());

    await service.create(makeFreeCreateData() as any, "VETERINARIAN", "user-1");

    expect(
      mockVeterinarianClinicRepository.findByVeterinarianAndClinic,
    ).toHaveBeenCalledWith("user-1", "clinic-1");
    expect(mockRepository.create).toHaveBeenCalledOnce();
  });

  it("performedAt manquant — BadRequestError", async () => {
    mockActRepository.findById.mockResolvedValue(makeAct());
    mockAnimalRepository.findById.mockResolvedValue(
      makeAnimal({ clientId: "user-1" }),
    );
    await expect(
      service.create(
        makeFreeCreateData({ performedAt: undefined }) as any,
        "CLIENT",
        "user-1",
      ),
    ).rejects.toThrow(BadRequestError);
  });

  it("crée une entrée libre avec succès", async () => {
    const history = makeHistory();
    mockActRepository.findById.mockResolvedValue(makeAct());
    mockAnimalRepository.findById.mockResolvedValue(
      makeAnimal({ clientId: "user-1" }),
    );
    mockRepository.create.mockResolvedValue(history);

    const result = await service.create(
      makeFreeCreateData() as any,
      "CLIENT",
      "user-1",
    );

    expect(mockRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        animalMeetingId: null,
        actId: "act-1",
        priceApplied: null,
      }),
    );
    expect(result).toEqual(history);
  });
});

// ── createFromMeeting ─────────────────────────────────────────────────────────

describe("AnimalMedicalHistoryService.create — flow RDV", () => {
  it("CLIENT — ForbiddenError (staff uniquement)", async () => {
    await expect(
      service.create(makeMeetingCreateData() as any, "CLIENT", "user-1"),
    ).rejects.toThrow(ForbiddenError);
  });

  it("animalMeetingId manquant — BadRequestError", async () => {
    await expect(
      service.create(
        makeMeetingCreateData({ animalMeetingId: undefined }) as any,
        "VETERINARIAN",
        "user-1",
      ),
    ).rejects.toThrow(BadRequestError);
  });

  it("animalMeeting introuvable — NotFoundError", async () => {
    mockAnimalMeetingRepository.findById.mockResolvedValue(null);
    await expect(
      service.create(makeMeetingCreateData() as any, "VETERINARIAN", "user-1"),
    ).rejects.toThrow(NotFoundError);
  });

  it("clinicActId manquant — BadRequestError", async () => {
    mockAnimalMeetingRepository.findById.mockResolvedValue(makeAnimalMeeting());
    await expect(
      service.create(
        makeMeetingCreateData({ clinicActId: undefined }) as any,
        "VETERINARIAN",
        "user-1",
      ),
    ).rejects.toThrow(BadRequestError);
  });

  it("clinicAct introuvable — NotFoundError", async () => {
    mockAnimalMeetingRepository.findById.mockResolvedValue(makeAnimalMeeting());
    mockClinicActRepository.findById.mockResolvedValue(null);
    await expect(
      service.create(makeMeetingCreateData() as any, "VETERINARIAN", "user-1"),
    ).rejects.toThrow(NotFoundError);
  });

  it("staff hors de la clinique de l'acte — ForbiddenError", async () => {
    mockAnimalMeetingRepository.findById.mockResolvedValue(makeAnimalMeeting());
    mockClinicActRepository.findById.mockResolvedValue(makeClinicAct());
    mockVeterinarianClinicRepository.findByVeterinarianAndClinic.mockResolvedValue(
      null,
    );
    await expect(
      service.create(makeMeetingCreateData() as any, "VETERINARIAN", "user-1"),
    ).rejects.toThrow(ForbiddenError);
  });

  it("veterinarianClinic du meeting introuvable — NotFoundError", async () => {
    mockAnimalMeetingRepository.findById.mockResolvedValue(makeAnimalMeeting());
    mockClinicActRepository.findById.mockResolvedValue(makeClinicAct());
    mockVeterinarianClinicRepository.findById.mockResolvedValue(null);
    await expect(
      service.create(makeMeetingCreateData() as any, "VETERINARIAN", "user-1"),
    ).rejects.toThrow(NotFoundError);
  });

  it("clinique du meeting différente du clinicAct — BadRequestError", async () => {
    mockAnimalMeetingRepository.findById.mockResolvedValue(makeAnimalMeeting());
    mockClinicActRepository.findById.mockResolvedValue(makeClinicAct());
    mockVeterinarianClinicRepository.findById.mockResolvedValue(
      makeVeterinarianClinic({ clinicId: "autre-clinic" }),
    );
    await expect(
      service.create(makeMeetingCreateData() as any, "VETERINARIAN", "user-1"),
    ).rejects.toThrow(BadRequestError);
  });

  it("pas de vaccination fournie — le check espèce est ignoré", async () => {
    mockAnimalMeetingRepository.findById.mockResolvedValue(makeAnimalMeeting());
    mockClinicActRepository.findById.mockResolvedValue(makeClinicAct());
    mockVeterinarianClinicRepository.findById.mockResolvedValue(
      makeVeterinarianClinic(),
    );
    mockRepository.create.mockResolvedValue(makeHistory());

    await service.create(
      makeMeetingCreateData() as any,
      "VETERINARIAN",
      "user-1",
    );

    expect(mockVaccineRepository.findById).not.toHaveBeenCalled();
    expect(mockRepository.create).toHaveBeenCalledOnce();
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
        makeMeetingCreateData({
          vaccination: { vaccineId: "vaccine-1" },
        }) as any,
        "VETERINARIAN",
        "user-1",
      ),
    ).rejects.toThrow(BadRequestError);
  });

  it("vaccin correspond à l'espèce — succès", async () => {
    mockAnimalMeetingRepository.findById.mockResolvedValue(makeAnimalMeeting());
    mockClinicActRepository.findById.mockResolvedValue(makeClinicAct());
    mockVeterinarianClinicRepository.findById.mockResolvedValue(
      makeVeterinarianClinic(),
    );
    mockAnimalRepository.findById.mockResolvedValue(makeAnimal());
    mockVaccineRepository.findById.mockResolvedValue(makeVaccine());
    mockRepository.create.mockResolvedValue(makeHistory());

    await service.create(
      makeMeetingCreateData({ vaccination: { vaccineId: "vaccine-1" } }) as any,
      "VETERINARIAN",
      "user-1",
    );

    expect(mockRepository.create).toHaveBeenCalledOnce();
  });

  it("performedAt manquant (ni meeting.date ni data.performedAt) — BadRequestError", async () => {
    mockAnimalMeetingRepository.findById.mockResolvedValue(
      makeAnimalMeeting({ meeting: { date: null } }),
    );
    mockClinicActRepository.findById.mockResolvedValue(makeClinicAct());
    mockVeterinarianClinicRepository.findById.mockResolvedValue(
      makeVeterinarianClinic(),
    );
    await expect(
      service.create(
        makeMeetingCreateData({ performedAt: undefined }) as any,
        "VETERINARIAN",
        "user-1",
      ),
    ).rejects.toThrow(BadRequestError);
  });

  it("performedAt déduit de data.performedAt si meeting.date absent", async () => {
    mockAnimalMeetingRepository.findById.mockResolvedValue(
      makeAnimalMeeting({ meeting: { date: null } }),
    );
    mockClinicActRepository.findById.mockResolvedValue(makeClinicAct());
    mockVeterinarianClinicRepository.findById.mockResolvedValue(
      makeVeterinarianClinic(),
    );
    mockRepository.create.mockResolvedValue(makeHistory());

    await service.create(
      makeMeetingCreateData({ performedAt: new Date("2026-01-01") }) as any,
      "VETERINARIAN",
      "user-1",
    );

    expect(mockRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ performedAt: new Date("2026-01-01") }),
    );
  });

  it("crée un acte RDV avec succès", async () => {
    const history = makeHistory({ animalMeetingId: "animal-meeting-1" });
    mockAnimalMeetingRepository.findById.mockResolvedValue(makeAnimalMeeting());
    mockClinicActRepository.findById.mockResolvedValue(makeClinicAct());
    mockVeterinarianClinicRepository.findById.mockResolvedValue(
      makeVeterinarianClinic(),
    );
    mockRepository.create.mockResolvedValue(history);

    const result = await service.create(
      makeMeetingCreateData() as any,
      "VETERINARIAN",
      "user-1",
    );

    expect(mockRepository.create).toHaveBeenCalledOnce();
    expect(result).toEqual(history);
  });

  it("priceApplied fourni — pas de fallback sur clinicAct.price", async () => {
    mockAnimalMeetingRepository.findById.mockResolvedValue(makeAnimalMeeting());
    mockClinicActRepository.findById.mockResolvedValue(makeClinicAct());
    mockVeterinarianClinicRepository.findById.mockResolvedValue(
      makeVeterinarianClinic(),
    );
    mockRepository.create.mockResolvedValue(makeHistory());

    await service.create(
      makeMeetingCreateData({ priceApplied: 99.99 }) as any,
      "VETERINARIAN",
      "user-1",
    );

    expect(mockRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ priceApplied: expect.anything() }),
    );
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
      makeMeetingCreateData({ priceApplied: undefined }) as any,
      "VETERINARIAN",
      "user-1",
    );

    expect(mockRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ priceApplied: clinicAct.price }),
    );
  });

  it("performedById résolu vers l'id VeterinarianClinic", async () => {
    mockAnimalMeetingRepository.findById.mockResolvedValue(makeAnimalMeeting());
    mockClinicActRepository.findById.mockResolvedValue(makeClinicAct());
    const vetClinic = makeVeterinarianClinic({ id: "vet-clinic-resolved" });
    mockVeterinarianClinicRepository.findById.mockResolvedValue(vetClinic);
    mockRepository.create.mockResolvedValue(makeHistory());

    await service.create(
      makeMeetingCreateData() as any,
      "VETERINARIAN",
      "user-1",
    );

    expect(mockRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ performedById: "vet-clinic-resolved" }),
      }),
    );
  });
});

// ── update ────────────────────────────────────────────────────────────────────

describe("AnimalMedicalHistoryService.update", () => {
  it("rôle non autorisé — ForbiddenError", async () => {
    await expect(
      service.update(
        "history-1",
        { type: "free" } as any,
        "DIRECTOR",
        "user-1",
      ),
    ).rejects.toThrow(ForbiddenError);
  });

  it("acte introuvable — NotFoundError", async () => {
    mockRepository.findById.mockResolvedValue(null);
    await expect(
      service.update(
        "unknown",
        { type: "free" } as any,
        "VETERINARIAN",
        "user-1",
      ),
    ).rejects.toThrow(NotFoundError);
  });

  it("CLIENT tente de modifier une entrée liée à un RDV — ForbiddenError (via assertCanMutate)", async () => {
    mockRepository.findById.mockResolvedValue(
      makeHistory({
        clinicActId: "clinic-act-1",
        animalMeetingId: "meeting-1",
      }),
    );
    await expect(
      service.update(
        "history-1",
        { type: "meeting" } as any,
        "CLIENT",
        "user-1",
      ),
    ).rejects.toThrow(ForbiddenError);
  });

  it("CLIENT sur l'animal d'un autre (entrée libre) — ForbiddenError", async () => {
    mockRepository.findById.mockResolvedValue(
      makeHistory({ animalMeetingId: null, clinicActId: null }),
    );
    mockAnimalRepository.findById.mockResolvedValue(
      makeAnimal({ clientId: "autre-client" }),
    );
    await expect(
      service.update("history-1", { type: "free" } as any, "CLIENT", "user-1"),
    ).rejects.toThrow(ForbiddenError);
  });

  it("changement de type refusé — BadRequestError", async () => {
    mockRepository.findById.mockResolvedValue(
      makeHistory({ animalMeetingId: null, clinicActId: null }),
    );
    mockAnimalRepository.findById.mockResolvedValue(
      makeAnimal({ clientId: "user-1" }),
    );
    await expect(
      service.update(
        "history-1",
        { type: "meeting" } as any,
        "CLIENT",
        "user-1",
      ),
    ).rejects.toThrow(BadRequestError);
  });

  it("CLIENT modifie sa propre entrée libre — succès", async () => {
    mockRepository.findById.mockResolvedValue(
      makeHistory({ animalMeetingId: null, clinicActId: null }),
    );
    mockAnimalRepository.findById.mockResolvedValue(
      makeAnimal({ clientId: "user-1" }),
    );
    mockRepository.update.mockResolvedValue(
      makeHistory({ notes: "Nouveau", animalMeetingId: null }),
    );

    const result = await service.update(
      "history-1",
      { type: "free", notes: "Nouveau" } as any,
      "CLIENT",
      "user-1",
    );

    expect(mockRepository.update).toHaveBeenCalledWith(
      "history-1",
      expect.objectContaining({ notes: "Nouveau" }),
    );
    expect(result).toHaveProperty("notes", "Nouveau");
  });

  it("staff modifie une entrée RDV de sa clinique — succès", async () => {
    mockRepository.findById.mockResolvedValue(
      makeHistory({
        animalMeetingId: "meeting-1",
        clinicActId: "clinic-act-1",
      }),
    );
    mockClinicActRepository.findById.mockResolvedValue(makeClinicAct());
    mockRepository.update.mockResolvedValue(
      makeHistory({ notes: "MàJ", animalMeetingId: "meeting-1" }),
    );

    const result = await service.update(
      "history-1",
      { type: "meeting", notes: "MàJ" } as any,
      "VETERINARIAN",
      "user-1",
    );

    expect(result).toHaveProperty("notes", "MàJ");
  });

  it("staff hors clinique tente de modifier une entrée RDV — ForbiddenError (via assertCanMutate)", async () => {
    mockRepository.findById.mockResolvedValue(
      makeHistory({
        animalMeetingId: "meeting-1",
        clinicActId: "clinic-act-1",
      }),
    );
    mockClinicActRepository.findById.mockResolvedValue(makeClinicAct());
    mockVeterinarianClinicRepository.findByVeterinarianAndClinic.mockResolvedValue(
      null,
    );

    await expect(
      service.update(
        "history-1",
        { type: "meeting" } as any,
        "SECRETARY",
        "user-1",
      ),
    ).rejects.toThrow(ForbiddenError);
  });

  it("staff modifie une entrée libre créée sur un animal de sa clinique — succès", async () => {
    mockRepository.findById.mockResolvedValue(
      makeHistory({ animalMeetingId: null, clinicActId: null }),
    );
    mockAnimalRepository.findById.mockResolvedValue(
      makeAnimal({ attendingVeterinarianClinic: { clinicId: "clinic-1" } }),
    );
    mockRepository.update.mockResolvedValue(
      makeHistory({ notes: "MàJ", animalMeetingId: null }),
    );

    const result = await service.update(
      "history-1",
      { type: "free", notes: "MàJ" } as any,
      "VETERINARIAN",
      "user-1",
    );

    expect(result).toHaveProperty("notes", "MàJ");
  });

  it("staff modifie une entrée libre d'un animal sans clinique de suivi — succès sans check clinique", async () => {
    mockRepository.findById.mockResolvedValue(
      makeHistory({ animalMeetingId: null, clinicActId: null }),
    );
    mockAnimalRepository.findById.mockResolvedValue(
      makeAnimal({ attendingVeterinarianClinic: null }),
    );
    mockRepository.update.mockResolvedValue(makeHistory({ notes: "MàJ" }));

    const result = await service.update(
      "history-1",
      { type: "free", notes: "MàJ" } as any,
      "VETERINARIAN",
      "user-1",
    );

    expect(
      mockVeterinarianClinicRepository.findByVeterinarianAndClinic,
    ).not.toHaveBeenCalled();
    expect(result).toHaveProperty("notes", "MàJ");
  });
});

// ── delete ────────────────────────────────────────────────────────────────────

describe("AnimalMedicalHistoryService.delete", () => {
  it("rôle non autorisé — ForbiddenError", async () => {
    await expect(
      service.delete("history-1", "DIRECTOR", "user-1"),
    ).rejects.toThrow(ForbiddenError);
  });

  it("acte introuvable — NotFoundError", async () => {
    mockRepository.findById.mockResolvedValue(null);
    await expect(
      service.delete("unknown", "VETERINARIAN", "user-1"),
    ).rejects.toThrow(NotFoundError);
  });

  it("CLIENT sur l'animal d'un autre — ForbiddenError", async () => {
    mockRepository.findById.mockResolvedValue(
      makeHistory({ animalMeetingId: null, clinicActId: null }),
    );
    mockAnimalRepository.findById.mockResolvedValue(
      makeAnimal({ clientId: "autre-client" }),
    );
    await expect(
      service.delete("history-1", "CLIENT", "user-1"),
    ).rejects.toThrow(ForbiddenError);
  });

  it("supprime l'acte (CLIENT, entrée libre propriétaire)", async () => {
    mockRepository.findById.mockResolvedValue(
      makeHistory({ animalMeetingId: null, clinicActId: null }),
    );
    mockAnimalRepository.findById.mockResolvedValue(
      makeAnimal({ clientId: "user-1" }),
    );
    mockRepository.delete.mockResolvedValue(undefined);

    await service.delete("history-1", "CLIENT", "user-1");

    expect(mockRepository.delete).toHaveBeenCalledWith("history-1");
  });

  it("supprime l'acte (staff, entrée RDV de sa clinique)", async () => {
    mockRepository.findById.mockResolvedValue(
      makeHistory({
        animalMeetingId: "meeting-1",
        clinicActId: "clinic-act-1",
      }),
    );
    mockClinicActRepository.findById.mockResolvedValue(makeClinicAct());
    mockRepository.delete.mockResolvedValue(undefined);

    await service.delete("history-1", "SECRETARY", "user-1");

    expect(mockRepository.delete).toHaveBeenCalledWith("history-1");
  });
});

// ── getByMeeting ──────────────────────────────────────────────────────────────

describe("AnimalMedicalHistoryService.getByMeeting", () => {
  it("rôle non autorisé — ForbiddenError", async () => {
    await expect(
      service.getByMeeting("meeting-1", "DIRECTOR", "user-1"),
    ).rejects.toThrow(ForbiddenError);
  });

  it("animalMeeting introuvable — NotFoundError", async () => {
    mockAnimalMeetingRepository.findById.mockResolvedValue(null);
    await expect(
      service.getByMeeting("meeting-1", "CLIENT", "user-1"),
    ).rejects.toThrow(NotFoundError);
  });

  it("CLIENT sur l'animal d'un autre — ForbiddenError", async () => {
    mockAnimalMeetingRepository.findById.mockResolvedValue(makeAnimalMeeting());
    mockAnimalRepository.findById.mockResolvedValue(
      makeAnimal({ clientId: "autre-client" }),
    );
    await expect(
      service.getByMeeting("meeting-1", "CLIENT", "user-1"),
    ).rejects.toThrow(ForbiddenError);
  });

  it("CLIENT propriétaire — succès", async () => {
    mockAnimalMeetingRepository.findById.mockResolvedValue(makeAnimalMeeting());
    mockAnimalRepository.findById.mockResolvedValue(
      makeAnimal({ clientId: "user-1" }),
    );
    mockRepository.findByMeeting.mockResolvedValue([makeHistory()]);

    const result = await service.getByMeeting("meeting-1", "CLIENT", "user-1");

    expect(result).toHaveLength(1);
  });

  it("staff avec veterinarianClinicId présent, hors clinique — ForbiddenError", async () => {
    mockAnimalMeetingRepository.findById.mockResolvedValue(makeAnimalMeeting());
    mockVeterinarianClinicRepository.findById.mockResolvedValue(
      makeVeterinarianClinic(),
    );
    mockVeterinarianClinicRepository.findByVeterinarianAndClinic.mockResolvedValue(
      null,
    );
    await expect(
      service.getByMeeting("meeting-1", "VETERINARIAN", "user-1"),
    ).rejects.toThrow(ForbiddenError);
  });

  it("staff avec veterinarianClinicId présent, dans la clinique — succès", async () => {
    mockAnimalMeetingRepository.findById.mockResolvedValue(makeAnimalMeeting());
    mockVeterinarianClinicRepository.findById.mockResolvedValue(
      makeVeterinarianClinic(),
    );
    mockRepository.findByMeeting.mockResolvedValue([makeHistory()]);

    const result = await service.getByMeeting(
      "meeting-1",
      "VETERINARIAN",
      "user-1",
    );

    expect(mockRepository.findByMeeting).toHaveBeenCalledWith("meeting-1");
    expect(result).toHaveLength(1);
  });

  it("staff avec veterinarianClinicId absent — aucune vérification, succès direct", async () => {
    mockAnimalMeetingRepository.findById.mockResolvedValue(
      makeAnimalMeeting({ veterinarianClinicId: null }),
    );
    mockRepository.findByMeeting.mockResolvedValue([makeHistory()]);

    const result = await service.getByMeeting(
      "meeting-1",
      "VETERINARIAN",
      "user-1",
    );

    expect(mockVeterinarianClinicRepository.findById).not.toHaveBeenCalled();
    expect(result).toHaveLength(1);
  });
});

// ── getByAnimal ───────────────────────────────────────────────────────────────

describe("AnimalMedicalHistoryService.getByAnimal", () => {
  it("rôle non autorisé — ForbiddenError", async () => {
    await expect(
      service.getByAnimal("animal-1" as AnimalId, "DIRECTOR", "user-1"),
    ).rejects.toThrow(ForbiddenError);
  });

  it("animal introuvable — NotFoundError", async () => {
    mockAnimalRepository.findById.mockResolvedValue(null);
    await expect(
      service.getByAnimal("animal-1" as AnimalId, "CLIENT", "user-1"),
    ).rejects.toThrow(NotFoundError);
  });

  it("CLIENT sur l'animal d'un autre — ForbiddenError", async () => {
    mockAnimalRepository.findById.mockResolvedValue(
      makeAnimal({ clientId: "autre-client" }),
    );
    await expect(
      service.getByAnimal("animal-1" as AnimalId, "CLIENT", "user-1"),
    ).rejects.toThrow(ForbiddenError);
  });

  it("CLIENT propriétaire — succès", async () => {
    mockAnimalRepository.findById.mockResolvedValue(
      makeAnimal({ clientId: "user-1" }),
    );
    mockRepository.findByAnimalId.mockResolvedValue([makeHistory()]);
    const result = await service.getByAnimal(
      "animal-1" as AnimalId,
      "CLIENT",
      "user-1",
    );
    expect(result).toHaveLength(1);
  });

  it("staff sans clinique de suivi sur l'animal — ForbiddenError", async () => {
    mockAnimalRepository.findById.mockResolvedValue(
      makeAnimal({ attendingVeterinarianClinic: null }),
    );
    await expect(
      service.getByAnimal("animal-1" as AnimalId, "VETERINARIAN", "user-1"),
    ).rejects.toThrow(ForbiddenError);
  });

  it("staff hors de la clinique suivant l'animal — ForbiddenError", async () => {
    mockAnimalRepository.findById.mockResolvedValue(
      makeAnimal({ attendingVeterinarianClinic: { clinicId: "clinic-1" } }),
    );
    mockVeterinarianClinicRepository.findByVeterinarianAndClinic.mockResolvedValue(
      null,
    );
    await expect(
      service.getByAnimal("animal-1" as AnimalId, "VETERINARIAN", "user-1"),
    ).rejects.toThrow(ForbiddenError);
  });

  it("staff dans la bonne clinique — succès", async () => {
    mockAnimalRepository.findById.mockResolvedValue(
      makeAnimal({ attendingVeterinarianClinic: { clinicId: "clinic-1" } }),
    );
    mockRepository.findByAnimalId.mockResolvedValue([makeHistory()]);

    const result = await service.getByAnimal(
      "animal-1" as AnimalId,
      "VETERINARIAN",
      "user-1",
    );

    expect(result).toHaveLength(1);
  });
});

// ── Fichiers (imaging / analysis) ────────────────────────────────────────────

describe("AnimalMedicalHistoryService.getFiles", () => {
  it("acte introuvable — NotFoundError", async () => {
    mockRepository.findById.mockResolvedValue(null);
    await expect(
      service.getFiles("history-1", "CLIENT", "user-1"),
    ).rejects.toThrow(NotFoundError);
  });

  it("CLIENT sur l'animal d'un autre — ForbiddenError (assertCanView)", async () => {
    mockRepository.findById.mockResolvedValue(
      makeHistory({ animalMeetingId: null, clinicActId: null }),
    );
    mockAnimalRepository.findById.mockResolvedValue(
      makeAnimal({ clientId: "autre-client" }),
    );
    await expect(
      service.getFiles("history-1", "CLIENT", "user-1"),
    ).rejects.toThrow(ForbiddenError);
  });

  it("staff sur entrée RDV de sa clinique — assertCanView passe", async () => {
    mockRepository.findById.mockResolvedValue(
      makeHistory({
        animalMeetingId: "meeting-1",
        clinicActId: "clinic-act-1",
        imaging: { id: "imaging-1" },
      }),
    );
    mockClinicActRepository.findById.mockResolvedValue(makeClinicAct());
    mockFileService.getByEntity.mockResolvedValue([]);

    await service.getFiles("history-1", "VETERINARIAN", "user-1");

    expect(mockFileService.getByEntity).toHaveBeenCalledWith(
      "IMAGING",
      "imaging-1",
    );
  });

  it("staff sur entrée libre d'un animal sans clinique — assertCanView passe silencieusement", async () => {
    mockRepository.findById.mockResolvedValue(
      makeHistory({ animalMeetingId: null, clinicActId: null }),
    );
    mockAnimalRepository.findById.mockResolvedValue(
      makeAnimal({ attendingVeterinarianClinic: null }),
    );

    const result = await service.getFiles(
      "history-1",
      "VETERINARIAN",
      "user-1",
    );

    expect(result).toEqual([]);
  });

  it("acte sans sous-modèle imaging/analysis — tableau vide", async () => {
    mockRepository.findById.mockResolvedValue(
      makeHistory({ animalMeetingId: null, clinicActId: null }),
    );
    mockAnimalRepository.findById.mockResolvedValue(
      makeAnimal({ clientId: "user-1" }),
    );
    const result = await service.getFiles("history-1", "CLIENT", "user-1");
    expect(result).toEqual([]);
    expect(mockFileService.getByEntity).not.toHaveBeenCalled();
  });

  it("résout IMAGING quand imaging présent", async () => {
    mockRepository.findById.mockResolvedValue(
      makeHistory({
        animalMeetingId: null,
        clinicActId: null,
        imaging: { id: "imaging-1" },
      }),
    );
    mockAnimalRepository.findById.mockResolvedValue(
      makeAnimal({ clientId: "user-1" }),
    );
    mockFileService.getByEntity.mockResolvedValue([{ id: "file-1" }]);

    const result = await service.getFiles("history-1", "CLIENT", "user-1");

    expect(mockFileService.getByEntity).toHaveBeenCalledWith(
      "IMAGING",
      "imaging-1",
    );
    expect(result).toEqual([{ id: "file-1" }]);
  });

  it("résout ANALYSIS quand analysis présent", async () => {
    mockRepository.findById.mockResolvedValue(
      makeHistory({
        animalMeetingId: null,
        clinicActId: null,
        analysis: { id: "analysis-1" },
      }),
    );
    mockAnimalRepository.findById.mockResolvedValue(
      makeAnimal({ clientId: "user-1" }),
    );
    mockFileService.getByEntity.mockResolvedValue([]);

    await service.getFiles("history-1", "CLIENT", "user-1");

    expect(mockFileService.getByEntity).toHaveBeenCalledWith(
      "ANALYSIS",
      "analysis-1",
    );
  });
});

describe("AnimalMedicalHistoryService.createFileUpload", () => {
  it("acte introuvable — NotFoundError", async () => {
    mockRepository.findById.mockResolvedValue(null);
    await expect(
      service.createFileUpload("history-1", "image/jpeg", "CLIENT", "user-1"),
    ).rejects.toThrow(NotFoundError);
  });

  it("acte sans sous-modèle — BadRequestError", async () => {
    mockRepository.findById.mockResolvedValue(
      makeHistory({ animalMeetingId: null, clinicActId: null }),
    );
    mockAnimalRepository.findById.mockResolvedValue(
      makeAnimal({ clientId: "user-1" }),
    );
    await expect(
      service.createFileUpload("history-1", "image/jpeg", "CLIENT", "user-1"),
    ).rejects.toThrow(BadRequestError);
  });

  it("type PDF détecté pour application/pdf", async () => {
    mockRepository.findById.mockResolvedValue(
      makeHistory({
        animalMeetingId: null,
        clinicActId: null,
        analysis: { id: "analysis-1" },
      }),
    );
    mockAnimalRepository.findById.mockResolvedValue(
      makeAnimal({ clientId: "user-1" }),
    );
    mockFileService.createUpload.mockResolvedValue({
      uploadUrl: "url",
      fileId: "f1",
    });

    await service.createFileUpload(
      "history-1",
      "application/pdf",
      "CLIENT",
      "user-1",
    );

    expect(mockFileService.createUpload).toHaveBeenCalledWith(
      expect.objectContaining({ type: "PDF", entityType: "ANALYSIS" }),
    );
  });

  it("type IMAGE détecté pour tout autre mimeType", async () => {
    mockRepository.findById.mockResolvedValue(
      makeHistory({
        animalMeetingId: null,
        clinicActId: null,
        imaging: { id: "imaging-1" },
      }),
    );
    mockAnimalRepository.findById.mockResolvedValue(
      makeAnimal({ clientId: "user-1" }),
    );
    mockFileService.createUpload.mockResolvedValue({
      uploadUrl: "url",
      fileId: "f1",
    });

    const result = await service.createFileUpload(
      "history-1",
      "image/jpeg",
      "CLIENT",
      "user-1",
    );

    expect(mockFileService.createUpload).toHaveBeenCalledWith(
      expect.objectContaining({
        entityType: "IMAGING",
        entityId: "imaging-1",
        type: "IMAGE",
      }),
    );
    expect(result).toEqual({ uploadUrl: "url", fileId: "f1" });
  });
});

describe("AnimalMedicalHistoryService.confirmFileUpload", () => {
  it("acte introuvable — NotFoundError", async () => {
    mockRepository.findById.mockResolvedValue(null);
    await expect(
      service.confirmFileUpload("history-1", "file-1", "CLIENT", "user-1"),
    ).rejects.toThrow(NotFoundError);
  });

  it("acte sans sous-modèle — BadRequestError", async () => {
    mockRepository.findById.mockResolvedValue(
      makeHistory({ animalMeetingId: null, clinicActId: null }),
    );
    mockAnimalRepository.findById.mockResolvedValue(
      makeAnimal({ clientId: "user-1" }),
    );
    await expect(
      service.confirmFileUpload("history-1", "file-1", "CLIENT", "user-1"),
    ).rejects.toThrow(BadRequestError);
  });

  it("confirme l'upload avec l'entityType/entityId résolus (ANALYSIS)", async () => {
    mockRepository.findById.mockResolvedValue(
      makeHistory({
        animalMeetingId: null,
        clinicActId: null,
        analysis: { id: "analysis-1" },
      }),
    );
    mockAnimalRepository.findById.mockResolvedValue(
      makeAnimal({ clientId: "user-1" }),
    );
    mockFileService.confirmUpload.mockResolvedValue({ id: "file-1" });

    const result = await service.confirmFileUpload(
      "history-1",
      "file-1",
      "CLIENT",
      "user-1",
    );

    expect(mockFileService.confirmUpload).toHaveBeenCalledWith({
      fileId: "file-1",
      expectedEntityType: "ANALYSIS",
      expectedEntityId: "analysis-1",
    });
    expect(result).toEqual({ id: "file-1" });
  });

  it("confirme l'upload avec l'entityType/entityId résolus (IMAGING)", async () => {
    mockRepository.findById.mockResolvedValue(
      makeHistory({
        animalMeetingId: null,
        clinicActId: null,
        imaging: { id: "imaging-1" },
      }),
    );
    mockAnimalRepository.findById.mockResolvedValue(
      makeAnimal({ clientId: "user-1" }),
    );
    mockFileService.confirmUpload.mockResolvedValue({ id: "file-2" });

    await service.confirmFileUpload("history-1", "file-2", "CLIENT", "user-1");

    expect(mockFileService.confirmUpload).toHaveBeenCalledWith({
      fileId: "file-2",
      expectedEntityType: "IMAGING",
      expectedEntityId: "imaging-1",
    });
  });
});
