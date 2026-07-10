import { describe, it, expect, vi, beforeEach } from "vitest";
import { NotFoundError } from "@api/errors";
import { ClinicId } from "@armali/schemas";

const mockMeetingRepository = vi.hoisted(() => ({
  getInternalMeetings: vi.fn(),
  getAnimalMeetingsAsVet: vi.fn(),
  getAnimalMeetingsAsClient: vi.fn(),
  getAvailabilities: vi.fn(),
  getAvailabilitiesByClinic: vi.fn(),
  getMeetingById: vi.fn(),
  getRecurringById: vi.fn(),
}));

const mockInternalMeetingRepository = vi.hoisted(() => ({
  findById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  findParticipant: vi.fn(),
  updateParticipantStatus: vi.fn(),
  updateParticipantStatusDirect: vi.fn(),
  createOccurrenceOverride: vi.fn(),
  copyParticipantStatuses: vi.fn(),
}));

vi.mock("@api/meetings/meeting.repository", () => ({
  MeetingRepository: vi.fn(function () {
    return mockMeetingRepository;
  }),
}));
vi.mock("@api/meetings/internal-meeting", () => ({
  InternalMeetingRepository: vi.fn(function () {
    return mockInternalMeetingRepository;
  }),
}));
vi.mock("@api/meetings/internal-meeting/internal-meeting.repository", () => ({
  InternalMeetingRepository: vi.fn(function () {
    return mockInternalMeetingRepository;
  }),
}));

const { MeetingRepository } = await import("@api/meetings/meeting.repository");
const { MeetingService } = await import("@api/meetings/meeting.service");

const meetingService = new MeetingService(new MeetingRepository({} as any));

// ── Fixtures ──────────────────────────────────────────────────────────────────

const start = new Date("2026-01-01T00:00:00.000Z");
const end = new Date("2026-01-31T00:00:00.000Z");

const makeBase = (overrides = {}) => ({
  id: "base-1",
  createdAt: new Date(),
  updatedAt: new Date(),
  type: "SPECIFIED" as const,
  kind: "ANIMAL" as const,
  startTime: new Date("1970-01-01T08:00:00.000Z"),
  endTime: new Date("1970-01-01T09:00:00.000Z"),
  date: new Date("2026-01-10T00:00:00.000Z"),
  recurringId: null,
  animalMeeting: null,
  internalMeeting: null,
  availabilty: null,
  ...overrides,
});

const makeRecurring = (overrides = {}) => ({
  id: "recurring-1",
  createdAt: new Date(),
  updatedAt: new Date(),
  kind: "ANIMAL" as const,
  dateStart: new Date("2026-01-01T00:00:00.000Z"),
  dateEnd: new Date("2026-01-31T00:00:00.000Z"),
  dayOfWeek: [1],
  startTime: new Date("1970-01-01T08:00:00.000Z"),
  endTime: new Date("1970-01-01T09:00:00.000Z"),
  frequency: "WEEKLY" as const,
  animalMeeting: null,
  internalMeeting: null,
  availabilty: null,
  childrens: [],
  ...overrides,
});

const makeAnimalSpecific = (overrides = {}) => ({
  id: "animal-1",
  description: null,
  petWeight: null,
  petSize: null,
  report: null,
  specialityId: null,
  recurringId: null,
  meetingId: "base-1",
  animalId: "pet-1",
  veterinarianId: "veto-1",
  ...overrides,
});

const makeInternalSpecific = (overrides = {}) => ({
  id: "internal-1",
  title: "Réunion équipe",
  recurringId: null,
  meetingId: "base-1",
  participants: [],
  ...overrides,
});

const makeAvailabilitySpecific = (overrides = {}) => ({
  id: "avail-1",
  userId: "veto-1",
  clinicId: "clinic-1",
  recurringId: null,
  meetingId: "base-1",
  clinic: { id: "clinic-1", name: "Clinique du Parc" },
  ...overrides,
});

const makeBaseWithAnimal = (overrides = {}) =>
  makeBase({
    kind: "ANIMAL" as const,
    animalMeeting: makeAnimalSpecific(),
    ...overrides,
  });

const makeRecurringWithAnimal = (overrides = {}) =>
  makeRecurring({
    kind: "ANIMAL" as const,
    animalMeeting: makeAnimalSpecific({
      meetingId: null,
      recurringId: "recurring-1",
    }),
    ...overrides,
  });

beforeEach(() => vi.clearAllMocks());

// ── expandRecurring ───────────────────────────────────────────────────────────

describe("MeetingService.expandRecurring", () => {
  it("génère les occurrences pour le bon jour de la semaine", () => {
    const reccuring = makeRecurringWithAnimal({ dayOfWeek: [1] });

    const result = meetingService.expandRecurring({ reccuring, start, end });

    expect(result).toHaveLength(4);
    result.forEach((r) => expect(new Date(r.date!).getUTCDay()).toBe(1));
  });

  it("exclut les dates d'exception", () => {
    const exceptionDate = "2026-01-05";
    const reccuring = makeRecurringWithAnimal({
      dayOfWeek: [1],
      childrens: [
        makeBase({
          type: "EXCEPTION" as const,
          date: new Date(`${exceptionDate}T00:00:00.000Z`),
          animalMeeting: makeAnimalSpecific(),
        }),
      ],
    });

    const result = meetingService.expandRecurring({ reccuring, start, end });

    expect(result).toHaveLength(3);
    result.forEach((r) =>
      expect(new Date(r.date!).toISOString().split("T")[0]).not.toBe(
        exceptionDate,
      ),
    );
  });

  it("retourne un tableau vide si aucune occurrence dans la plage", () => {
    const reccuring = makeRecurringWithAnimal({ dayOfWeek: [1] });

    const result = meetingService.expandRecurring({
      reccuring,
      start: new Date("2026-03-01T00:00:00.000Z"),
      end: new Date("2026-03-31T00:00:00.000Z"),
    });

    expect(result).toHaveLength(0);
  });

  it("les occurrences ont type SPECIFIED", () => {
    const reccuring = makeRecurringWithAnimal({ dayOfWeek: [1] });

    const result = meetingService.expandRecurring({ reccuring, start, end });

    result.forEach((r) => expect(r.type).toBe("SPECIFIED"));
  });

  it("utilise le contenu du children SPECIFIED pour la date correspondante", () => {
    const overrideDate = "2026-01-05";
    const reccuring = makeRecurringWithAnimal({
      dayOfWeek: [1],
      childrens: [
        makeBaseWithAnimal({
          type: "SPECIFIED" as const,
          date: new Date(`${overrideDate}T00:00:00.000Z`),
          animalMeeting: makeAnimalSpecific({
            description: "Consultation spéciale",
          }),
        }),
      ],
    });

    const result = meetingService.expandRecurring({ reccuring, start, end });

    const override = result.find(
      (r) => new Date(r.date!).toISOString().split("T")[0] === overrideDate,
    );
    expect(override).toBeDefined();
    if (override && "description" in override) {
      expect(override.description).toBe("Consultation spéciale");
    }
  });

  it("ignore les exceptions qui ne sont pas de type EXCEPTION", () => {
    const reccuring = makeRecurringWithAnimal({
      dayOfWeek: [1],
      childrens: [
        makeBaseWithAnimal({
          type: "SPECIFIED" as const,
          date: new Date("2026-01-05T00:00:00.000Z"),
        }),
      ],
    });

    const result = meetingService.expandRecurring({ reccuring, start, end });

    expect(result).toHaveLength(4);
  });

  it("utilise internalMeeting comme fallback si animalMeeting absent", () => {
    const reccuring = makeRecurring({
      kind: "INTERNAL" as const,
      dayOfWeek: [1],
      internalMeeting: makeInternalSpecific({ meetingId: null }),
    });

    const result = meetingService.expandRecurring({ reccuring, start, end });

    expect(result).toHaveLength(4);
    result.forEach((r) => expect(r).toHaveProperty("title", "Réunion équipe"));
  });

  it("utilise availabilty comme fallback si animalMeeting/internalMeeting absents", () => {
    const reccuring = makeRecurring({
      kind: "AVAILABILITY" as const,
      dayOfWeek: [1],
      availabilty: makeAvailabilitySpecific({ meetingId: null }),
    });

    const result = meetingService.expandRecurring({ reccuring, start, end });

    expect(result).toHaveLength(4);
  });

  it("throw si aucun sous-type n'est présent sur la récurrence", () => {
    const reccuring = makeRecurring({ dayOfWeek: [1] });

    expect(() =>
      meetingService.expandRecurring({ reccuring, start, end }),
    ).toThrow();
  });
});

// ── flattenMeetingByBase ──────────────────────────────────────────────────────

describe("MeetingService.flattenMeetingByBase", () => {
  it("aplatit un meeting de type ANIMAL", () => {
    const base = makeBaseWithAnimal();
    const result = meetingService.flattenMeetingByBase(base);
    expect(result).toHaveProperty("animalId", "pet-1");
  });

  it("aplatit un meeting de type INTERNAL", () => {
    const base = makeBase({
      kind: "INTERNAL" as const,
      internalMeeting: makeInternalSpecific(),
    });
    const result = meetingService.flattenMeetingByBase(base);
    expect(result).toHaveProperty("title", "Réunion équipe");
  });

  it("aplatit un meeting de type AVAILABILITY", () => {
    const base = makeBase({
      kind: "AVAILABILITY" as const,
      availabilty: makeAvailabilitySpecific(),
    });
    const result = meetingService.flattenMeetingByBase(base);
    expect(result).toHaveProperty("userId", "veto-1");
  });

  it("throw si aucun sous-type n'est présent", () => {
    const base = makeBase();
    expect(() => meetingService.flattenMeetingByBase(base)).toThrow();
  });
});

// ── getInternalMeetings ───────────────────────────────────────────────────────

describe("MeetingService.getInternalMeetings", () => {
  it("aplatit les participations avec recurring", async () => {
    mockMeetingRepository.getInternalMeetings.mockResolvedValue([
      {
        meeting: {
          recurring: makeRecurring({
            kind: "INTERNAL" as const,
            dayOfWeek: [1],
            internalMeeting: makeInternalSpecific({ meetingId: null }),
          }),
          meeting: null,
        },
      },
    ]);

    const result = await meetingService.getInternalMeetings(
      "user-1",
      start,
      end,
    );

    expect(result.length).toBeGreaterThan(0);
  });

  it("aplatit les participations avec meeting direct (non récurrent)", async () => {
    mockMeetingRepository.getInternalMeetings.mockResolvedValue([
      {
        meeting: {
          recurring: null,
          meeting: makeBase({
            kind: "INTERNAL" as const,
            internalMeeting: makeInternalSpecific(),
          }),
        },
      },
    ]);

    const result = await meetingService.getInternalMeetings(
      "user-1",
      start,
      end,
    );

    expect(result).toHaveLength(1);
  });

  it("ignore les participations sans recurring ni meeting", async () => {
    mockMeetingRepository.getInternalMeetings.mockResolvedValue([
      { meeting: { recurring: null, meeting: null } },
    ]);

    const result = await meetingService.getInternalMeetings(
      "user-1",
      start,
      end,
    );

    expect(result).toHaveLength(0);
  });
});

// ── getAnimalMeetingsAsVet ────────────────────────────────────────────────────

describe("MeetingService.getAnimalMeetingsAsVet", () => {
  it("aplatit les meetings avec meeting présent", async () => {
    mockMeetingRepository.getAnimalMeetingsAsVet.mockResolvedValue([
      { meeting: makeBaseWithAnimal() },
    ]);

    const result = await meetingService.getAnimalMeetingsAsVet(
      "vet-1",
      start,
      end,
    );

    expect(result).toHaveLength(1);
  });

  it("ignore les entrées sans meeting", async () => {
    mockMeetingRepository.getAnimalMeetingsAsVet.mockResolvedValue([
      { meeting: null },
    ]);

    const result = await meetingService.getAnimalMeetingsAsVet(
      "vet-1",
      start,
      end,
    );

    expect(result).toHaveLength(0);
  });
});

// ── getAnimalMeetingsAsClient ─────────────────────────────────────────────────

describe("MeetingService.getAnimalMeetingsAsClient", () => {
  it("aplatit les meetings avec meeting présent", async () => {
    mockMeetingRepository.getAnimalMeetingsAsClient.mockResolvedValue([
      { meeting: makeBaseWithAnimal() },
    ]);

    const result = await meetingService.getAnimalMeetingsAsClient(
      "client-1",
      start,
      end,
    );

    expect(result).toHaveLength(1);
  });

  it("ignore les entrées sans meeting", async () => {
    mockMeetingRepository.getAnimalMeetingsAsClient.mockResolvedValue([
      { meeting: null },
    ]);

    const result = await meetingService.getAnimalMeetingsAsClient(
      "client-1",
      start,
      end,
    );

    expect(result).toHaveLength(0);
  });
});

// ── getAvailabilities ─────────────────────────────────────────────────────────

describe("MeetingService.getAvailabilities", () => {
  it("aplatit avec recurring", async () => {
    mockMeetingRepository.getAvailabilities.mockResolvedValue([
      {
        recurring: makeRecurring({
          kind: "AVAILABILITY" as const,
          dayOfWeek: [1],
          availabilty: makeAvailabilitySpecific({ meetingId: null }),
        }),
        meeting: null,
      },
    ]);

    const result = await meetingService.getAvailabilities({
      userId: "user-1",
      start,
      end,
    });

    expect(result.length).toBeGreaterThan(0);
  });

  it("aplatit avec meeting direct", async () => {
    mockMeetingRepository.getAvailabilities.mockResolvedValue([
      {
        recurring: null,
        meeting: makeBase({
          kind: "AVAILABILITY" as const,
          availabilty: makeAvailabilitySpecific(),
        }),
      },
    ]);

    const result = await meetingService.getAvailabilities({
      userId: "user-1",
      start,
      end,
    });

    expect(result).toHaveLength(1);
  });

  it("ignore les entrées sans recurring ni meeting", async () => {
    mockMeetingRepository.getAvailabilities.mockResolvedValue([
      { recurring: null, meeting: null },
    ]);

    const result = await meetingService.getAvailabilities({
      userId: "user-1",
      start,
      end,
    });

    expect(result).toHaveLength(0);
  });

  it("propage clinicIds au repository", async () => {
    mockMeetingRepository.getAvailabilities.mockResolvedValue([]);

    await meetingService.getAvailabilities({
      userId: "user-1",
      start,
      end,
      clinicIds: ["clinic-1"],
    });

    expect(mockMeetingRepository.getAvailabilities).toHaveBeenCalledWith({
      userId: "user-1",
      start,
      end,
      clinicIds: ["clinic-1"],
    });
  });
});

// ── getCalendar ───────────────────────────────────────────────────────────────

describe("MeetingService.getCalendar", () => {
  it("VETERINARIAN avec vetProfileId — récupère les animalMeetings", async () => {
    mockMeetingRepository.getInternalMeetings.mockResolvedValue([]);
    mockMeetingRepository.getAnimalMeetingsAsVet.mockResolvedValue([
      { meeting: makeBaseWithAnimal() },
    ]);
    mockMeetingRepository.getAvailabilities.mockResolvedValue([]);

    const result = await meetingService.getCalendar({
      userId: "user-1",
      role: "VETERINARIAN",
      vetProfileId: "vet-1",
      start,
      end,
    });

    expect(mockMeetingRepository.getAnimalMeetingsAsVet).toHaveBeenCalled();
    expect(result.meetings).toHaveLength(1);
  });

  it("VETERINARIAN sans vetProfileId — tableau vide, pas d'appel repository", async () => {
    mockMeetingRepository.getInternalMeetings.mockResolvedValue([]);
    mockMeetingRepository.getAvailabilities.mockResolvedValue([]);

    const result = await meetingService.getCalendar({
      userId: "user-1",
      role: "VETERINARIAN",
      start,
      end,
    });

    expect(mockMeetingRepository.getAnimalMeetingsAsVet).not.toHaveBeenCalled();
    expect(result.meetings).toHaveLength(0);
  });

  it("CLIENT avec clientProfileId — récupère les animalMeetings", async () => {
    mockMeetingRepository.getInternalMeetings.mockResolvedValue([]);
    mockMeetingRepository.getAnimalMeetingsAsClient.mockResolvedValue([
      { meeting: makeBaseWithAnimal() },
    ]);
    mockMeetingRepository.getAvailabilities.mockResolvedValue([]);

    const result = await meetingService.getCalendar({
      userId: "user-1",
      role: "CLIENT",
      clientProfileId: "client-1",
      start,
      end,
    });

    expect(mockMeetingRepository.getAnimalMeetingsAsClient).toHaveBeenCalled();
    expect(result.meetings).toHaveLength(1);
  });

  it("CLIENT sans clientProfileId — tableau vide, pas d'appel repository", async () => {
    mockMeetingRepository.getInternalMeetings.mockResolvedValue([]);
    mockMeetingRepository.getAvailabilities.mockResolvedValue([]);

    const result = await meetingService.getCalendar({
      userId: "user-1",
      role: "CLIENT",
      start,
      end,
    });

    expect(
      mockMeetingRepository.getAnimalMeetingsAsClient,
    ).not.toHaveBeenCalled();
    expect(result.meetings).toHaveLength(0);
  });

  it("SECRETARY (otherwise) — tableau vide, aucun appel animalMeetings", async () => {
    mockMeetingRepository.getInternalMeetings.mockResolvedValue([]);
    mockMeetingRepository.getAvailabilities.mockResolvedValue([]);

    const result = await meetingService.getCalendar({
      userId: "user-1",
      role: "SECRETARY",
      start,
      end,
    });

    expect(mockMeetingRepository.getAnimalMeetingsAsVet).not.toHaveBeenCalled();
    expect(
      mockMeetingRepository.getAnimalMeetingsAsClient,
    ).not.toHaveBeenCalled();
    expect(result.meetings).toHaveLength(0);
  });

  it("combine internal meetings et animal meetings", async () => {
    mockMeetingRepository.getInternalMeetings.mockResolvedValue([
      {
        meeting: {
          recurring: null,
          meeting: makeBase({
            kind: "INTERNAL" as const,
            internalMeeting: makeInternalSpecific(),
          }),
        },
      },
    ]);
    mockMeetingRepository.getAnimalMeetingsAsVet.mockResolvedValue([
      { meeting: makeBaseWithAnimal() },
    ]);
    mockMeetingRepository.getAvailabilities.mockResolvedValue([]);

    const result = await meetingService.getCalendar({
      userId: "user-1",
      role: "VETERINARIAN",
      vetProfileId: "vet-1",
      start,
      end,
    });

    expect(result.meetings).toHaveLength(2);
  });
});

// ── getMeeting ────────────────────────────────────────────────────────────────

describe("MeetingService.getMeeting", () => {
  it("meeting introuvable — NotFoundError", async () => {
    mockMeetingRepository.getMeetingById.mockResolvedValue(null);
    await expect(meetingService.getMeetingById("unknown")).rejects.toThrow(
      NotFoundError,
    );
  });

  it("retourne le meeting aplati", async () => {
    mockMeetingRepository.getMeetingById.mockResolvedValue(
      makeBaseWithAnimal(),
    );
    const result = await meetingService.getMeetingById("base-1");
    expect(result).toHaveProperty("animalId", "pet-1");
  });
});

// ── getVetSlots / sliceAvailabilityIntoSlots / overlaps ──────────────────────

describe("MeetingService.getVetSlots", () => {
  it("découpe une disponibilité en créneaux libres, en excluant les créneaux occupés", async () => {
    const availability = {
      ...makeAvailabilitySpecific(),
      startTime: new Date("1970-01-01T08:00:00.000Z"),
      endTime: new Date("1970-01-01T10:00:00.000Z"),
      date: new Date("2026-06-01T00:00:00.000Z"),
    };

    mockMeetingRepository.getAvailabilities.mockResolvedValue([
      {
        recurring: null,
        meeting: makeBase({
          kind: "AVAILABILITY" as const,
          availabilty: availability,
        }),
      },
    ]);
    mockMeetingRepository.getInternalMeetings.mockResolvedValue([]);
    mockMeetingRepository.getAnimalMeetingsAsVet.mockResolvedValue([
      {
        meeting: makeBaseWithAnimal({
          startTime: new Date("1970-01-01T08:30:00.000Z"),
          endTime: new Date("1970-01-01T09:00:00.000Z"),
        }),
      },
    ]);

    const slots = await meetingService.getVetSlots({
      veterinarianId: "vet-1",
      start,
      end,
      clinicIds: ["clinic-1" as ClinicId],
    });

    // 08:00-10:00 en tranches de 30min = 4 créneaux, dont 08:30-09:00 occupé
    expect(slots.length).toBeGreaterThan(0);
    const occupiedSlot = slots.find(
      (s) => s.startTime.toISOString() === "1970-01-01T08:30:00.000Z",
    );
    expect(occupiedSlot).toBeUndefined();
  });

  it("utilise slotDurationMinutes personnalisé", async () => {
    const availability = {
      ...makeAvailabilitySpecific(),
      startTime: new Date("1970-01-01T08:00:00.000Z"),
      endTime: new Date("1970-01-01T09:00:00.000Z"),
      date: new Date("2026-06-01T00:00:00.000Z"),
    };

    mockMeetingRepository.getAvailabilities.mockResolvedValue([
      {
        recurring: null,
        meeting: makeBase({
          kind: "AVAILABILITY" as const,
          availabilty: availability,
        }),
      },
    ]);
    mockMeetingRepository.getInternalMeetings.mockResolvedValue([]);
    mockMeetingRepository.getAnimalMeetingsAsVet.mockResolvedValue([]);

    const slots = await meetingService.getVetSlots({
      veterinarianId: "vet-1",
      start,
      end,
      slotDurationMinutes: 15,
      clinicIds: ["clinic-1" as ClinicId],
    });

    // 1h / 15min = 4 créneaux
    expect(slots).toHaveLength(4);
  });

  it("aucune disponibilité — tableau vide", async () => {
    mockMeetingRepository.getAvailabilities.mockResolvedValue([]);
    mockMeetingRepository.getInternalMeetings.mockResolvedValue([]);
    mockMeetingRepository.getAnimalMeetingsAsVet.mockResolvedValue([]);

    const slots = await meetingService.getVetSlots({
      veterinarianId: "vet-1",
      start,
      end,
      clinicIds: ["clinic-1" as ClinicId],
    });

    expect(slots).toHaveLength(0);
  });
});

// ── getAvailabilityTimeline ───────────────────────────────────────────────────

describe("MeetingService.getAvailabilityTimeline", () => {
  it("retourne windows et busy à partir des disponibilités et rendez-vous", async () => {
    const availability = {
      ...makeAvailabilitySpecific(),
      startTime: new Date("1970-01-01T08:00:00.000Z"),
      endTime: new Date("1970-01-01T18:00:00.000Z"),
      date: new Date("2026-06-01T00:00:00.000Z"),
    };

    mockMeetingRepository.getAvailabilities.mockResolvedValue([
      {
        recurring: null,
        meeting: makeBase({
          kind: "AVAILABILITY" as const,
          availabilty: availability,
        }),
      },
    ]);
    mockMeetingRepository.getInternalMeetings.mockResolvedValue([
      {
        meeting: {
          recurring: null,
          meeting: makeBase({
            kind: "INTERNAL" as const,
            internalMeeting: makeInternalSpecific(),
            startTime: new Date("1970-01-01T10:00:00.000Z"),
            endTime: new Date("1970-01-01T10:30:00.000Z"),
          }),
        },
      },
    ]);
    mockMeetingRepository.getAnimalMeetingsAsVet.mockResolvedValue([
      {
        meeting: makeBaseWithAnimal({
          startTime: new Date("1970-01-01T14:00:00.000Z"),
          endTime: new Date("1970-01-01T14:30:00.000Z"),
        }),
      },
    ]);

    const result = await meetingService.getAvailabilityTimeline({
      veterinarianId: "vet-1",
      clinicIds: ["clinic-1"],
      start,
      end,
    });

    expect(result.windows).toHaveLength(1);
    expect(result.busy).toHaveLength(2);
  });

  it("aucune disponibilité ni rendez-vous — tableaux vides", async () => {
    mockMeetingRepository.getAvailabilities.mockResolvedValue([]);
    mockMeetingRepository.getInternalMeetings.mockResolvedValue([]);
    mockMeetingRepository.getAnimalMeetingsAsVet.mockResolvedValue([]);

    const result = await meetingService.getAvailabilityTimeline({
      veterinarianId: "vet-1",
      clinicIds: ["clinic-1"],
      start,
      end,
    });

    expect(result.windows).toHaveLength(0);
    expect(result.busy).toHaveLength(0);
  });
});
