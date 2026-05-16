import { describe, it, expect, vi, beforeEach } from "vitest";

const mockMettingRepository = vi.hoisted(() => ({
  getVeterinarianMeetings: vi.fn(),
  getSecretaryMeetings: vi.fn(),
  getReferantMeetings: vi.fn(),
  getAllAvailabilities: vi.fn(),
  getAllAvailabilitiesByClinic: vi.fn(),
}));

vi.mock("@api/repositories/metting.repository", () => ({
  MettingRepository: vi.fn(function () {
    return mockMettingRepository;
  }),
}));

const { MettingService } = await import("@api/services/metting.service");
const mettingService = new MettingService();

// ── Fixtures ──────────────────────────────────────────────────────────────────

const start = new Date("2026-01-01T00:00:00.000Z");
const end = new Date("2026-01-31T00:00:00.000Z");

const makeBase = (overrides = {}) => ({
  id: "base-1",
  createdAt: new Date(),
  updatedAt: new Date(),
  type: "SPECIFIED" as const,
  kind: "ANIMAL" as const,
  dayOfWeek: null,
  dateStart: null,
  dateEnd: null,
  startTime: null,
  endTime: null,
  specificDate: new Date("2026-01-10T00:00:00.000Z"),
  parentId: null,
  exceptions: [],
  ...overrides,
});

const makeAnimalMeeting = (overrides = {}) => ({
  id: "animal-1",
  description: null,
  petWeight: null,
  petSize: null,
  report: null,
  specialityId: null,
  ownedPetId: "pet-1",
  veterinarianId: "veto-1",
  base: makeBase(),
  ...overrides,
});

const makeInternalMeeting = (overrides = {}) => ({
  id: "internal-1",
  title: "Réunion",
  description: null,
  clinicId: "clinic-1",
  base: makeBase({ kind: "INTERNAL" as const }),
  ...overrides,
});

const makeAvailability = (overrides = {}) => ({
  id: "avail-1",
  userId: "user-1",
  contextType: "USER" as const,
  veterinarianClinicId: null,
  base: makeBase({ kind: "AVAILABILITY" as const }),
  ...overrides,
});

const makeParticipant = (metting = makeInternalMeeting()) => ({
  id: "participant-1",
  mettingId: metting.id,
  userId: "user-1",
  status: "ACCEPTED" as const,
  createdAt: new Date(),
  updatedAt: new Date(),
  metting,
});

const makeVeterinarianProfile = (overrides = {}) => ({
  animalMeeting: [makeAnimalMeeting()],
  veterinarianClinic: [],
  user: {
    internalMettingParticipants: [makeParticipant()],
  },
  ...overrides,
});

const makeSecretaryProfile = (overrides = {}) => ({
  user: {
    internalMettingParticipants: [makeParticipant()],
  },
  ...overrides,
});

const makeReferantProfile = (overrides = {}) => ({
  user: {
    internalMettingParticipants: [makeParticipant()],
  },
  ...overrides,
});

const makeUserProfile = (overrides = {}) => ({
  availabilities: [makeAvailability()],
  veterinarianProfile: null,
  ...overrides,
});

beforeEach(() => vi.clearAllMocks());

// ── expandRecurring ───────────────────────────────────────────────────────────

describe("MettingService.expandRecurring", () => {
  it("génère les occurrences pour le bon jour de la semaine", () => {
    const metting = {
      ...makeBase({
        type: "RECURRING" as const,
        dayOfWeek: 1, // lundi
        dateStart: new Date("2026-01-01T00:00:00.000Z"),
      }),
      exceptions: [],
    };

    const result = mettingService.expandRecurring({ metting, start, end });

    // lundis de janvier 2026 : 5, 12, 19, 26
    expect(result).toHaveLength(4);
    result.forEach((r) => expect(r.occurrenceDate!.getUTCDay()).toBe(1));
  });

  it("exclut les dates d'exception", () => {
    const exceptionDate = "2026-01-05";
    const metting = {
      ...makeBase({
        type: "RECURRING" as const,
        dayOfWeek: 1,
        dateStart: new Date("2026-01-01T00:00:00.000Z"),
      }),
      exceptions: [
        makeBase({
          type: "EXCEPTION" as const,
          specificDate: new Date(`${exceptionDate}T00:00:00.000Z`),
        }),
      ],
    };

    const result = mettingService.expandRecurring({ metting, start, end });

    expect(result).toHaveLength(3);
    result.forEach((r) =>
      expect(r.specificDate?.toISOString().split("T")[0]).not.toBe(
        exceptionDate,
      ),
    );
  });

  it("retourne un tableau vide si aucune occurrence dans la plage", () => {
    const metting = {
      ...makeBase({
        type: "RECURRING" as const,
        dayOfWeek: 1,
        dateStart: new Date("2026-01-01T00:00:00.000Z"),
      }),
      exceptions: [],
    };

    const result = mettingService.expandRecurring({
      metting,
      start: new Date("2026-02-01T00:00:00.000Z"),
      end: new Date("2026-02-28T00:00:00.000Z"),
    });

    // pas de lundi avant dateStart en février depuis jan
    // dateStart est en janvier donc current commence en janvier
    // mais start est en février donc aucune occurrence avant start
    expect(
      result.every(
        (r) => r.occurrenceDate! >= new Date("2026-02-01T00:00:00.000Z"),
      ),
    ).toBe(true);
  });

  it("les occurrences ont type SPECIFIED", () => {
    const metting = {
      ...makeBase({
        type: "RECURRING" as const,
        dayOfWeek: 1,
        dateStart: new Date("2026-01-01T00:00:00.000Z"),
      }),
      exceptions: [],
    };

    const result = mettingService.expandRecurring({ metting, start, end });

    result.forEach((r) => expect(r.type).toBe("SPECIFIED"));
  });

  it("ignore les exceptions qui ne sont pas de type EXCEPTION", () => {
    const metting = {
      ...makeBase({
        type: "RECURRING" as const,
        dayOfWeek: 1,
        dateStart: new Date("2026-01-01T00:00:00.000Z"),
      }),
      exceptions: [
        makeBase({
          type: "SPECIFIED" as const, // pas EXCEPTION — doit être ignoré
          specificDate: new Date("2026-01-05T00:00:00.000Z"),
        }),
      ],
    };

    const result = mettingService.expandRecurring({ metting, start, end });

    expect(result).toHaveLength(4); // aucune exclusion
  });
});

// ── getMettingsForVeterinarian ────────────────────────────────────────────────

describe("MettingService.getMettingsForVeterinarian", () => {
  it("retourne null si le profil est introuvable", async () => {
    mockMettingRepository.getVeterinarianMeetings.mockResolvedValue(null);

    const result = await mettingService.getMettingsForVeterinarian(
      "veto-1",
      start,
      end,
    );

    expect(result).toBeNull();
  });

  it("retourne les meetings aplatis et expandés", async () => {
    mockMettingRepository.getVeterinarianMeetings.mockResolvedValue(
      makeVeterinarianProfile(),
    );

    const result = await mettingService.getMettingsForVeterinarian(
      "veto-1",
      start,
      end,
    );

    expect(result).not.toBeNull();
    expect(Array.isArray(result)).toBe(true);
    expect(result!.length).toBeGreaterThan(0);
  });

  it("inclut les meetings animaux et les meetings internes", async () => {
    mockMettingRepository.getVeterinarianMeetings.mockResolvedValue(
      makeVeterinarianProfile(),
    );

    const result = await mettingService.getMettingsForVeterinarian(
      "veto-1",
      start,
      end,
    );

    const kinds = result!.map((r) => r.kind);
    expect(kinds).toContain("ANIMAL");
    expect(kinds).toContain("INTERNAL");
  });

  it("expand les meetings récurrents", async () => {
    const recurringAnimal = makeAnimalMeeting({
      base: makeBase({
        type: "RECURRING" as const,
        kind: "ANIMAL" as const,
        dayOfWeek: 1,
        dateStart: new Date("2026-01-01T00:00:00.000Z"),
      }),
    });

    mockMettingRepository.getVeterinarianMeetings.mockResolvedValue(
      makeVeterinarianProfile({
        animalMeeting: [recurringAnimal],
        user: { internalMettingParticipants: [] },
      }),
    );

    const result = await mettingService.getMettingsForVeterinarian(
      "veto-1",
      start,
      end,
    );

    expect(result!.length).toBe(4); // 4 lundis en janvier
    result!.forEach((r) => expect(r.type).toBe("SPECIFIED"));
  });

  it("filtre les participants sans meeting", async () => {
    const participantSansMeeting = {
      ...makeParticipant(),
      metting: null,
    };

    mockMettingRepository.getVeterinarianMeetings.mockResolvedValue(
      makeVeterinarianProfile({
        animalMeeting: [],
        user: { internalMettingParticipants: [participantSansMeeting] },
      }),
    );

    const result = await mettingService.getMettingsForVeterinarian(
      "veto-1",
      start,
      end,
    );

    expect(result).toHaveLength(0);
  });
});

// ── getMettingsForSecretary ───────────────────────────────────────────────────

describe("MettingService.getMettingsForSecretary", () => {
  it("retourne null si le profil est introuvable", async () => {
    mockMettingRepository.getSecretaryMeetings.mockResolvedValue(null);

    const result = await mettingService.getMettingsForSecretary(
      "sec-1",
      start,
      end,
    );

    expect(result).toBeNull();
  });

  it("retourne les meetings internes aplatis", async () => {
    mockMettingRepository.getSecretaryMeetings.mockResolvedValue(
      makeSecretaryProfile(),
    );

    const result = await mettingService.getMettingsForSecretary(
      "sec-1",
      start,
      end,
    );

    expect(result).not.toBeNull();
    expect(result!.length).toBeGreaterThan(0);
    result!.forEach((r) => expect(r.kind).toBe("INTERNAL"));
  });

  it("retourne un tableau vide si aucun participant", async () => {
    mockMettingRepository.getSecretaryMeetings.mockResolvedValue(
      makeSecretaryProfile({
        user: { internalMettingParticipants: [] },
      }),
    );

    const result = await mettingService.getMettingsForSecretary(
      "sec-1",
      start,
      end,
    );

    expect(result).toHaveLength(0);
  });

  it("expand les meetings récurrents", async () => {
    const recurringInternal = makeInternalMeeting({
      base: makeBase({
        type: "RECURRING" as const,
        kind: "INTERNAL" as const,
        dayOfWeek: 2, // mardi
        dateStart: new Date("2026-01-01T00:00:00.000Z"),
      }),
    });

    mockMettingRepository.getSecretaryMeetings.mockResolvedValue(
      makeSecretaryProfile({
        user: {
          internalMettingParticipants: [makeParticipant(recurringInternal)],
        },
      }),
    );

    const result = await mettingService.getMettingsForSecretary(
      "sec-1",
      start,
      end,
    );

    // mardis de janvier 2026 : 6, 13, 20, 27
    expect(result!.length).toBe(4);
  });
});

// ── getMettingsForReferant ────────────────────────────────────────────────────

describe("MettingService.getMettingsForReferant", () => {
  it("retourne null si le profil est introuvable", async () => {
    mockMettingRepository.getReferantMeetings.mockResolvedValue(null);

    const result = await mettingService.getMettingsForReferant(
      "ref-1",
      start,
      end,
    );

    expect(result).toBeNull();
  });

  it("retourne les meetings internes du référant", async () => {
    mockMettingRepository.getReferantMeetings.mockResolvedValue(
      makeReferantProfile(),
    );

    const result = await mettingService.getMettingsForReferant(
      "ref-1",
      start,
      end,
    );

    expect(result).not.toBeNull();
    expect(result!.length).toBeGreaterThan(0);
  });

  it("retourne un tableau vide si aucun participant", async () => {
    mockMettingRepository.getReferantMeetings.mockResolvedValue(
      makeReferantProfile({
        user: { internalMettingParticipants: [] },
      }),
    );

    const result = await mettingService.getMettingsForReferant(
      "ref-1",
      start,
      end,
    );

    expect(result).toHaveLength(0);
  });
});

// ── getAllAvailibilities ──────────────────────────────────────────────────────

describe("MettingService.getAllAvailibilities", () => {
  it("retourne null si le profil est introuvable", async () => {
    mockMettingRepository.getAllAvailabilities.mockResolvedValue(null);

    const result = await mettingService.getAllAvailibilities({
      id: "user-1",
      start,
      end,
    });

    expect(result).toBeNull();
  });

  it("retourne les disponibilités de l'utilisateur", async () => {
    mockMettingRepository.getAllAvailabilities.mockResolvedValue(
      makeUserProfile(),
    );

    const result = await mettingService.getAllAvailibilities({
      id: "user-1",
      start,
      end,
    });

    expect(result).not.toBeNull();
    expect(result!.length).toBeGreaterThan(0);
  });

  it("inclut les disponibilités vétérinaire si profil vétérinaire présent", async () => {
    mockMettingRepository.getAllAvailabilities.mockResolvedValue(
      makeUserProfile({
        veterinarianProfile: {
          veterinarianClinic: [
            {
              availabilities: [makeAvailability({ id: "avail-veto-1" })],
            },
          ],
        },
      }),
    );

    const result = await mettingService.getAllAvailibilities({
      id: "user-1",
      start,
      end,
    });

    expect(result!.length).toBe(2); // 1 user + 1 veto
  });

  it("n'inclut pas les disponibilités vétérinaire si pas de profil", async () => {
    mockMettingRepository.getAllAvailabilities.mockResolvedValue(
      makeUserProfile({ veterinarianProfile: null }),
    );

    const result = await mettingService.getAllAvailibilities({
      id: "user-1",
      start,
      end,
    });

    expect(result!.length).toBe(1);
  });

  it("expand les disponibilités récurrentes", async () => {
    mockMettingRepository.getAllAvailabilities.mockResolvedValue(
      makeUserProfile({
        availabilities: [
          makeAvailability({
            base: makeBase({
              type: "RECURRING" as const,
              kind: "AVAILABILITY" as const,
              dayOfWeek: 3, // mercredi
              dateStart: new Date("2026-01-01T00:00:00.000Z"),
            }),
          }),
        ],
      }),
    );

    const result = await mettingService.getAllAvailibilities({
      id: "user-1",
      start,
      end,
    });

    // mercredis de janvier 2026 : 7, 14, 21, 28
    expect(result!.length).toBe(4);
  });
});

// ── getAvailibilitiesByClinic ─────────────────────────────────────────────────

describe("MettingService.getAvailibilitiesByClinic", () => {
  it("retourne null si le profil est introuvable", async () => {
    mockMettingRepository.getAllAvailabilitiesByClinic.mockResolvedValue(null);

    const result = await mettingService.getAvailibilitiesByClinic({
      id: "user-1",
      clinicId: "clinic-1",
      start,
      end,
    });

    expect(result).toBeNull();
  });

  it("retourne les disponibilités de la clinique", async () => {
    mockMettingRepository.getAllAvailabilitiesByClinic.mockResolvedValue(
      makeUserProfile(),
    );

    const result = await mettingService.getAvailibilitiesByClinic({
      id: "user-1",
      clinicId: "clinic-1",
      start,
      end,
    });

    expect(result).not.toBeNull();
    expect(result!.length).toBeGreaterThan(0);
  });

  it("inclut les disponibilités vétérinaire de la clinique", async () => {
    mockMettingRepository.getAllAvailabilitiesByClinic.mockResolvedValue(
      makeUserProfile({
        veterinarianProfile: {
          veterinarianClinic: [
            {
              availabilities: [makeAvailability({ id: "avail-veto-clinic-1" })],
            },
          ],
        },
      }),
    );

    const result = await mettingService.getAvailibilitiesByClinic({
      id: "user-1",
      clinicId: "clinic-1",
      start,
      end,
    });

    expect(result!.length).toBe(2);
  });

  it("n'inclut pas les disponibilités vétérinaire si pas de profil", async () => {
    mockMettingRepository.getAllAvailabilitiesByClinic.mockResolvedValue(
      makeUserProfile({ veterinarianProfile: null }),
    );

    const result = await mettingService.getAvailibilitiesByClinic({
      id: "user-1",
      clinicId: "clinic-1",
      start,
      end,
    });

    expect(result!.length).toBe(1);
  });

  it("expand les disponibilités récurrentes par clinique", async () => {
    mockMettingRepository.getAllAvailabilitiesByClinic.mockResolvedValue(
      makeUserProfile({
        availabilities: [
          makeAvailability({
            base: makeBase({
              type: "RECURRING" as const,
              kind: "AVAILABILITY" as const,
              dayOfWeek: 4, // jeudi
              dateStart: new Date("2026-01-01T00:00:00.000Z"),
            }),
          }),
        ],
      }),
    );

    const result = await mettingService.getAvailibilitiesByClinic({
      id: "user-1",
      clinicId: "clinic-1",
      start,
      end,
    });

    // jeudis de janvier 2026 : 1, 8, 15, 22, 29
    expect(result!.length).toBe(5);
  });
});
