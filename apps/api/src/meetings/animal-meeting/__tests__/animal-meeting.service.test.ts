import { describe, it, expect, vi, beforeEach } from "vitest";

const mockMeetingRepository = vi.hoisted(() => ({
  getAnimalMeetingsAsVet: vi.fn(),
  getAnimalMeetingsAsClient: vi.fn(),
  getMeetingById: vi.fn(),
  getInternalMeetings: vi.fn(),
  getAvailabilities: vi.fn(),
  getAvailabilitiesByClinic: vi.fn(),
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
const { InternalMeetingRepository } =
  await import("@api/meetings/internal-meeting/internal-meeting.repository");
const { MeetingService } = await import("@api/meetings/meeting.service");

const meetingService = new MeetingService(
  new MeetingRepository({} as any),
  new InternalMeetingRepository({} as any),
);

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

beforeEach(() => vi.clearAllMocks());

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
