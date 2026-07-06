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
