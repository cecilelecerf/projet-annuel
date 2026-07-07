import { describe, it, expect, vi, beforeEach } from "vitest";
import { NotFoundError } from "@api/errors";

const mockRepository = vi.hoisted(() => ({
  findById: vi.fn(),
  update: vi.fn(),
  splitFromDate: vi.fn(),
}));

const mockInternalMeetingRepository = vi.hoisted(() => ({
  update: vi.fn(),
}));

vi.mock("../recurring-meeting.repository", () => ({
  RecurringRepository: vi.fn(function () {
    return mockRepository;
  }),
}));

vi.mock("../../internal-meeting", () => ({
  InternalMeetingRepository: vi.fn(function () {
    return mockInternalMeetingRepository;
  }),
}));

const { RecurringRepository } = await import("../recurring-meeting.repository");
const { InternalMeetingRepository } = await import("../../internal-meeting");
const { RecurringService } = await import("../recurring-meeting.service");

const service = new RecurringService(
  new RecurringRepository({} as any),
  new InternalMeetingRepository({} as any),
);

beforeEach(() => vi.clearAllMocks());

const RECURRING_ID = "11111111-1111-4111-8111-111111111111";

const makeRecurring = (overrides = {}) => ({
  id: RECURRING_ID,
  dayOfWeek: 1,
  startTime: "09:00",
  endTime: "10:00",
  frequency: "WEEKLY",
  dateStart: new Date("2026-06-01T00:00:00.000Z"),
  dateEnd: null,
  kind: "AVAILABILITY",
  availabilty: { userId: "user-1", clinicId: "clinic-1" },
  internalMeeting: null,
  ...overrides,
});

const makeInternalMeeting = (overrides = {}) => ({
  id: "internal-meeting-1",
  title: "Réunion interne",
  description: "Description",
  adminId: "admin-1",
  clinicId: "clinic-1",
  participants: [{ userId: "user-1", status: "PENDING" }],
  ...overrides,
});

// ── getById ──────────────────────────────────────────────────────────────────

describe("RecurringService.getById", () => {
  it("retourne la récurrence trouvée", async () => {
    mockRepository.findById.mockResolvedValue(makeRecurring());

    const result = await service.getById(RECURRING_ID as any);

    expect(mockRepository.findById).toHaveBeenCalledWith(RECURRING_ID);
    expect(result.id).toBe(RECURRING_ID);
  });

  it("lève NotFoundError si absente", async () => {
    mockRepository.findById.mockResolvedValue(null);

    await expect(service.getById("unknown" as any)).rejects.toThrow(
      NotFoundError,
    );
  });
});

// ── update ───────────────────────────────────────────────────────────────────

describe("RecurringService.update — modification en place (dateStart >= splitDate)", () => {
  it("met à jour sans toucher au meeting interne si absent des données ou de l'entité", async () => {
    const current = makeRecurring({
      dateStart: new Date("2026-06-10T00:00:00.000Z"),
    });
    mockRepository.findById.mockResolvedValue(current);
    mockRepository.update.mockResolvedValue(current);

    const data = {
      dateToStartAction: "2026-06-01",
      startTime: "10:00",
    } as any;

    await service.update({ id: RECURRING_ID as any, data });

    expect(mockInternalMeetingRepository.update).not.toHaveBeenCalled();
    expect(mockRepository.update).toHaveBeenCalledWith(RECURRING_ID, {
      startTime: "10:00",
    });
    expect(mockRepository.splitFromDate).not.toHaveBeenCalled();
  });

  it("retire bien dateToStartAction du payload transmis au repository", async () => {
    const current = makeRecurring({
      dateStart: new Date("2026-06-10T00:00:00.000Z"),
    });
    mockRepository.findById.mockResolvedValue(current);
    mockRepository.update.mockResolvedValue(current);

    const data = {
      dateToStartAction: "2026-06-01",
      endTime: "11:00",
      dayOfWeek: 2,
    } as any;

    await service.update({ id: RECURRING_ID as any, data });

    const [, payload] = mockRepository.update.mock.calls[0];
    expect(payload).not.toHaveProperty("dateToStartAction");
    expect(payload).toEqual({ endTime: "11:00", dayOfWeek: 2 });
  });

  it("met à jour le meeting interne quand internalMeeting existe et data.internal est fourni", async () => {
    const internalMeeting = makeInternalMeeting();
    const current = makeRecurring({
      dateStart: new Date("2026-06-10T00:00:00.000Z"),
      kind: "INTERNAL",
      internalMeeting,
    });
    mockRepository.findById.mockResolvedValue(current);
    mockRepository.update.mockResolvedValue(current);

    const data = {
      dateToStartAction: "2026-06-01",
      internal: { title: "Nouveau titre" },
    } as any;

    await service.update({ id: RECURRING_ID as any, data });

    expect(mockInternalMeetingRepository.update).toHaveBeenCalledWith({
      id: internalMeeting.id,
      data: { title: "Nouveau titre" },
    });
    expect(mockRepository.update).toHaveBeenCalledWith(RECURRING_ID, {
      internal: { title: "Nouveau titre" },
    });
  });

  it("ne met pas à jour le meeting interne si internalMeeting est absent, même si data.internal est fourni", async () => {
    const current = makeRecurring({
      dateStart: new Date("2026-06-10T00:00:00.000Z"),
      internalMeeting: null,
    });
    mockRepository.findById.mockResolvedValue(current);
    mockRepository.update.mockResolvedValue(current);

    const data = {
      dateToStartAction: "2026-06-01",
      internal: { title: "Nouveau titre" },
    } as any;

    await service.update({ id: RECURRING_ID as any, data });

    expect(mockInternalMeetingRepository.update).not.toHaveBeenCalled();
  });

  it("ne met pas à jour le meeting interne si data.internal est absent, même si internalMeeting existe", async () => {
    const internalMeeting = makeInternalMeeting();
    const current = makeRecurring({
      dateStart: new Date("2026-06-10T00:00:00.000Z"),
      kind: "INTERNAL",
      internalMeeting,
    });
    mockRepository.findById.mockResolvedValue(current);
    mockRepository.update.mockResolvedValue(current);

    const data = { dateToStartAction: "2026-06-01" } as any;

    await service.update({ id: RECURRING_ID as any, data });

    expect(mockInternalMeetingRepository.update).not.toHaveBeenCalled();
  });

  it("cas limite : dateStart === splitDate déclenche la modification en place, pas un split", async () => {
    const current = makeRecurring({
      dateStart: new Date("2026-06-01T00:00:00.000Z"),
    });
    mockRepository.findById.mockResolvedValue(current);
    mockRepository.update.mockResolvedValue(current);

    const data = { dateToStartAction: "2026-06-01", startTime: "08:00" } as any;

    await service.update({ id: RECURRING_ID as any, data });

    expect(mockRepository.update).toHaveBeenCalled();
    expect(mockRepository.splitFromDate).not.toHaveBeenCalled();
  });
});

describe("RecurringService.update — split de série (dateStart < splitDate)", () => {
  it("délègue au repository.splitFromDate avec current, data et splitDate calculé", async () => {
    const current = makeRecurring({
      dateStart: new Date("2026-06-01T00:00:00.000Z"),
    });
    mockRepository.findById.mockResolvedValue(current);
    mockRepository.splitFromDate.mockResolvedValue(
      makeRecurring({ id: "new-id" }),
    );

    const data = { dateToStartAction: "2026-06-15", startTime: "14:00" } as any;

    await service.update({ id: RECURRING_ID as any, data });

    expect(mockRepository.splitFromDate).toHaveBeenCalledWith(
      current,
      data,
      new Date("2026-06-15T00:00:00.000Z"),
    );
    expect(mockRepository.update).not.toHaveBeenCalled();
    expect(mockInternalMeetingRepository.update).not.toHaveBeenCalled();
  });

  it("retourne le résultat de splitFromDate", async () => {
    const current = makeRecurring({
      dateStart: new Date("2026-06-01T00:00:00.000Z"),
    });
    const newRecurring = makeRecurring({ id: "new-recurring-id" });
    mockRepository.findById.mockResolvedValue(current);
    mockRepository.splitFromDate.mockResolvedValue(newRecurring);

    const data = { dateToStartAction: "2026-06-15" } as any;

    const result = await service.update({ id: RECURRING_ID as any, data });

    expect(result).toEqual(newRecurring);
  });
});

describe("RecurringService.update — propagation d'erreur", () => {
  it("lève NotFoundError si la récurrence n'existe pas, sans appeler update/splitFromDate", async () => {
    mockRepository.findById.mockResolvedValue(null);

    await expect(
      service.update({
        id: "unknown" as any,
        data: { dateToStartAction: "2026-06-01" } as any,
      }),
    ).rejects.toThrow(NotFoundError);

    expect(mockRepository.update).not.toHaveBeenCalled();
    expect(mockRepository.splitFromDate).not.toHaveBeenCalled();
  });
});
