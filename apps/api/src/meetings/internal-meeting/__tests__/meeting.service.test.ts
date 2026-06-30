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

const makeBaseWithInternal = (overrides = {}) =>
  makeBase({
    kind: "INTERNAL" as const,
    internalMeeting: makeInternalSpecific(),
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
