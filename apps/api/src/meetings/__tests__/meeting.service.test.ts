import { describe, it, expect, vi, beforeEach } from "vitest";

const mockMeetingRepository = vi.hoisted(() => ({
  getInternalMeetings: vi.fn(),
  getAnimalMeetingsAsVet: vi.fn(),
  getAnimalMeetingsAsClient: vi.fn(),
  getAvailabilities: vi.fn(),
  getAvailabilitiesByClinic: vi.fn(),
  getMeetingById: vi.fn(),
  getRecurringById: vi.fn(),
}));

vi.mock("@api/meetings/meeting.repository", () => ({
  MeetingRepository: vi.fn(function () {
    return mockMeetingRepository;
  }),
}));

const { MeetingService } = await import("@api/meetings/meeting.service");
const meetingService = new MeetingService();

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
  title: "Réunion",
  description: null,
  clinicId: "clinic-1",
  recurringId: null,
  meetingId: "base-1",
  participants: [],
  ...overrides,
});

const makeAvailabilitySpecific = (overrides = {}) => ({
  id: "avail-1",
  userId: "user-1",
  veterinarianClinicId: null,
  recurringId: null,
  meetingId: "base-1",
  ...overrides,
});

const makeBaseWithAnimal = (overrides = {}) =>
  makeBase({
    kind: "ANIMAL" as const,
    animalMeeting: makeAnimalSpecific(),
    ...overrides,
  });

const makeBaseWithInternal = (overrides = {}) =>
  makeBase({
    kind: "INTERNAL" as const,
    internalMeeting: makeInternalSpecific(),
    ...overrides,
  });

const makeBaseWithAvailability = (overrides = {}) =>
  makeBase({
    kind: "AVAILABILITY" as const,
    availabilty: makeAvailabilitySpecific(),
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

const makeRecurringWithInternal = (overrides = {}) =>
  makeRecurring({
    kind: "INTERNAL" as const,
    internalMeeting: makeInternalSpecific({
      meetingId: null,
      recurringId: "recurring-1",
    }),
    ...overrides,
  });

const makeRecurringWithAvailability = (overrides = {}) =>
  makeRecurring({
    kind: "AVAILABILITY" as const,
    availabilty: makeAvailabilitySpecific({
      meetingId: null,
      recurringId: "recurring-1",
    }),
    ...overrides,
  });

const makeParticipant = (overrides = {}) => ({
  id: "participant-1",
  userId: "user-1",
  status: "ACCEPTED" as const,
  createdAt: new Date(),
  updatedAt: new Date(),
  meeting: {
    id: "internal-1",
    title: "Réunion",
    description: null,
    clinicId: "clinic-1",
    recurringId: null,
    meetingId: "base-1",
    participants: [],
    recurring: null,
    meeting: makeBaseWithInternal(),
  },
  ...overrides,
});

beforeEach(() => vi.clearAllMocks());

// ── expandRecurring ───────────────────────────────────────────────────────────

describe("MeetingService.expandRecurring", () => {
  it("génère les occurrences pour le bon jour de la semaine", () => {
    const reccuring = makeRecurringWithAnimal({ dayOfWeek: [1] });

    const result = meetingService.expandRecurring({ reccuring, start, end });

    // lundis de janvier 2026 : 5, 12, 19, 26
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
});

// ── getInternalMeetings ───────────────────────────────────────────────────────

describe("MeetingService.getInternalMeetings", () => {
  it("retourne un tableau vide si aucun participant", async () => {
    mockMeetingRepository.getInternalMeetings.mockResolvedValue([]);

    const result = await meetingService.getInternalMeetings(
      "user-1",
      start,
      end,
    );

    expect(result).toHaveLength(0);
  });

  it("retourne les meetings internes aplatis", async () => {
    mockMeetingRepository.getInternalMeetings.mockResolvedValue([
      makeParticipant(),
    ]);

    const result = await meetingService.getInternalMeetings(
      "user-1",
      start,
      end,
    );

    expect(result.length).toBeGreaterThan(0);
    result.forEach((r) => expect(r.kind).toBe("INTERNAL"));
  });

  it("expand les meetings récurrents", async () => {
    mockMeetingRepository.getInternalMeetings.mockResolvedValue([
      makeParticipant({
        meeting: {
          id: "internal-1",
          title: "Réunion",
          description: null,
          clinicId: "clinic-1",
          recurringId: "recurring-1",
          meetingId: null,
          participants: [],
          recurring: makeRecurringWithInternal({ dayOfWeek: [2] }), // mardi
          meeting: null,
        },
      }),
    ]);

    const result = await meetingService.getInternalMeetings(
      "user-1",
      start,
      end,
    );

    // mardis de janvier 2026 : 6, 13, 20, 27
    expect(result).toHaveLength(4);
    result.forEach((r) => expect(r.type).toBe("SPECIFIED"));
  });

  it("filtre les participants sans meeting ponctuel ni récurrent", async () => {
    mockMeetingRepository.getInternalMeetings.mockResolvedValue([
      makeParticipant({
        meeting: {
          id: "internal-1",
          title: "Réunion",
          description: null,
          clinicId: "clinic-1",
          recurringId: null,
          meetingId: null,
          participants: [],
          recurring: null,
          meeting: null,
        },
      }),
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
  it("retourne un tableau vide si aucun meeting", async () => {
    mockMeetingRepository.getAnimalMeetingsAsVet.mockResolvedValue([]);

    const result = await meetingService.getAnimalMeetingsAsVet(
      "veto-1",
      start,
      end,
    );

    expect(result).toHaveLength(0);
  });

  it("retourne les meetings animaux ponctuels aplatis", async () => {
    mockMeetingRepository.getAnimalMeetingsAsVet.mockResolvedValue([
      {
        ...makeAnimalSpecific(),
        recurring: null,
        meeting: makeBaseWithAnimal(),
      },
    ]);

    const result = await meetingService.getAnimalMeetingsAsVet(
      "veto-1",
      start,
      end,
    );

    expect(result.length).toBeGreaterThan(0);
    result.forEach((r) => expect(r.kind).toBe("ANIMAL"));
  });

  it("expand les meetings animaux récurrents", async () => {
    mockMeetingRepository.getAnimalMeetingsAsVet.mockResolvedValue([
      {
        ...makeAnimalSpecific(),
        recurring: makeRecurringWithAnimal({ dayOfWeek: [1] }),
        meeting: null,
      },
    ]);

    const result = await meetingService.getAnimalMeetingsAsVet(
      "veto-1",
      start,
      end,
    );

    // lundis de janvier 2026 : 5, 12, 19, 26
    expect(result).toHaveLength(4);
  });
});

// ── getAnimalMeetingsAsClient ─────────────────────────────────────────────────

describe("MeetingService.getAnimalMeetingsAsClient", () => {
  it("retourne un tableau vide si aucun meeting", async () => {
    mockMeetingRepository.getAnimalMeetingsAsClient.mockResolvedValue([]);

    const result = await meetingService.getAnimalMeetingsAsClient(
      "client-1",
      start,
      end,
    );

    expect(result).toHaveLength(0);
  });

  it("retourne les meetings animaux du client aplatis", async () => {
    mockMeetingRepository.getAnimalMeetingsAsClient.mockResolvedValue([
      {
        ...makeAnimalSpecific(),
        recurring: null,
        meeting: makeBaseWithAnimal(),
      },
    ]);

    const result = await meetingService.getAnimalMeetingsAsClient(
      "client-1",
      start,
      end,
    );

    expect(result.length).toBeGreaterThan(0);
    result.forEach((r) => expect(r.kind).toBe("ANIMAL"));
  });
});

// ── getAvailabilities ─────────────────────────────────────────────────────────

describe("MeetingService.getAvailabilities", () => {
  it("retourne un tableau vide si aucune disponibilité", async () => {
    mockMeetingRepository.getAvailabilities.mockResolvedValue([]);

    const result = await meetingService.getAvailabilities({
      userId: "user-1",
      start,
      end,
    });

    expect(result).toHaveLength(0);
  });

  it("retourne les disponibilités ponctuelles aplaties", async () => {
    mockMeetingRepository.getAvailabilities.mockResolvedValue([
      {
        ...makeAvailabilitySpecific(),
        recurring: null,
        meeting: makeBaseWithAvailability(),
      },
    ]);

    const result = await meetingService.getAvailabilities({
      userId: "user-1",
      start,
      end,
    });

    expect(result.length).toBeGreaterThan(0);
    result.forEach((r) => expect(r.kind).toBe("AVAILABILITY"));
  });

  it("expand les disponibilités récurrentes", async () => {
    mockMeetingRepository.getAvailabilities.mockResolvedValue([
      {
        ...makeAvailabilitySpecific(),
        recurring: makeRecurringWithAvailability({ dayOfWeek: [3] }), // mercredi
        meeting: null,
      },
    ]);

    const result = await meetingService.getAvailabilities({
      userId: "user-1",
      start,
      end,
    });

    // mercredis de janvier 2026 : 7, 14, 21, 28
    expect(result).toHaveLength(4);
  });
});

// ── getAvailabilitiesByClinic ─────────────────────────────────────────────────

describe("MeetingService.getAvailabilitiesByClinic", () => {
  it("retourne un tableau vide si aucune disponibilité", async () => {
    mockMeetingRepository.getAvailabilitiesByClinic.mockResolvedValue([]);

    const result = await meetingService.getAvailabilitiesByClinic({
      clinicId: "clinic-1",
      start,
      end,
    });

    expect(result).toHaveLength(0);
  });

  it("retourne les disponibilités de la clinique aplaties", async () => {
    mockMeetingRepository.getAvailabilitiesByClinic.mockResolvedValue([
      {
        ...makeAvailabilitySpecific(),
        recurring: null,
        meeting: makeBaseWithAvailability(),
      },
    ]);

    const result = await meetingService.getAvailabilitiesByClinic({
      clinicId: "clinic-1",
      start,
      end,
    });

    expect(result.length).toBeGreaterThan(0);
  });

  it("expand les disponibilités récurrentes par clinique", async () => {
    mockMeetingRepository.getAvailabilitiesByClinic.mockResolvedValue([
      {
        ...makeAvailabilitySpecific(),
        recurring: makeRecurringWithAvailability({ dayOfWeek: [4] }), // jeudi
        meeting: null,
      },
    ]);

    const result = await meetingService.getAvailabilitiesByClinic({
      clinicId: "clinic-1",
      start,
      end,
    });

    // jeudis de janvier 2026 : 1, 8, 15, 22, 29
    expect(result).toHaveLength(5);
  });
});
