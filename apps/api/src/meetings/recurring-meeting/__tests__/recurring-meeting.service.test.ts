import { describe, it, expect, vi, beforeEach } from "vitest";
import { NotFoundError } from "@api/errors";
import { RecurringWithRelations } from "../recurring-meeting.repository";
import { MeetingStatus } from "../../../../prisma/generated/prisma/enums";

const mockRepository = vi.hoisted(() => ({
  findById: vi.fn(),
  update: vi.fn(),
  splitFromDate: vi.fn(),
  createException: vi.fn(),
}));

const mockInternalMeetingRepository = vi.hoisted(() => ({
  update: vi.fn(),
  createPunctual: vi.fn(),
}));

const mockAvailabilityRepository = vi.hoisted(() => ({
  createPunctual: vi.fn(),
}));

vi.mock("../recurring-meeting.repository", () => ({
  RecurringRepository: vi.fn(function () {
    return mockRepository;
  }),
}));
vi.mock("../../internal-meeting/internal-meeting.repository", () => ({
  InternalMeetingRepository: vi.fn(function () {
    return mockInternalMeetingRepository;
  }),
}));
vi.mock("../../availabilities/availability.repository", () => ({
  AvailabilityRepository: vi.fn(function () {
    return mockAvailabilityRepository;
  }),
}));

const { RecurringRepository } = await import("../recurring-meeting.repository");
const { InternalMeetingRepository } =
  await import("../../internal-meeting/internal-meeting.repository");
const { AvailabilityRepository } =
  await import("../../availabilities/availability.repository");
const { RecurringService } = await import("../recurring-meeting.service");

const service = new RecurringService(
  new RecurringRepository({} as any),
  new InternalMeetingRepository({} as any),
  new AvailabilityRepository({} as any),
);

beforeEach(() => vi.clearAllMocks());

const RECURRING_ID = "11111111-1111-4111-8111-111111111111";

const makeRecurring = (
  overrides: Partial<RecurringWithRelations> = {},
): RecurringWithRelations => ({
  id: RECURRING_ID,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  dayOfWeek: [1],
  startTime: new Date("1970-01-01T09:00:00.000Z"),
  endTime: new Date("1970-01-01T10:00:00.000Z"),
  frequency: "WEEKLY",
  dateStart: new Date("2026-06-01T00:00:00.000Z"),
  dateEnd: new Date("2026-12-31T00:00:00.000Z"),
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
  participants: [{ userId: "user-1", status: "PENDING" as MeetingStatus }],
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

    const data = { dateToStartAction: "2026-06-01", startTime: "10:00" } as any;
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
      dayOfWeek: [2],
    } as any;
    await service.update({ id: RECURRING_ID as any, data });

    const [, payload] = mockRepository.update.mock.calls[0];
    expect(payload).not.toHaveProperty("dateToStartAction");
    expect(payload).toEqual({ endTime: "11:00", dayOfWeek: [2] });
  });

  it("met à jour le meeting interne quand internalMeeting existe et data.internal est fourni", async () => {
    const internalMeeting = makeInternalMeeting();
    const current = makeRecurring({
      dateStart: new Date("2026-06-10T00:00:00.000Z"),
      kind: "INTERNAL",
      internalMeeting: {
        ...internalMeeting,
        participants: internalMeeting.participants.map((p) => ({
          ...p,
          status: p.status as MeetingStatus,
        })),
      },
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

  it("ne met pas à jour le meeting interne si internalMeeting est absent", async () => {
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

  it("ne met pas à jour le meeting interne si data.internal est absent", async () => {
    const current = makeRecurring({
      dateStart: new Date("2026-06-10T00:00:00.000Z"),
      kind: "INTERNAL",
      internalMeeting: makeInternalMeeting(),
    });
    mockRepository.findById.mockResolvedValue(current);
    mockRepository.update.mockResolvedValue(current);

    await service.update({
      id: RECURRING_ID as any,
      data: { dateToStartAction: "2026-06-01" } as any,
    });

    expect(mockInternalMeetingRepository.update).not.toHaveBeenCalled();
  });

  it("cas limite : dateStart === splitDate déclenche la modification en place", async () => {
    const current = makeRecurring({
      dateStart: new Date("2026-06-01T00:00:00.000Z"),
    });
    mockRepository.findById.mockResolvedValue(current);
    mockRepository.update.mockResolvedValue(current);

    await service.update({
      id: RECURRING_ID as any,
      data: { dateToStartAction: "2026-06-01", startTime: "08:00" } as any,
    });

    expect(mockRepository.update).toHaveBeenCalled();
    expect(mockRepository.splitFromDate).not.toHaveBeenCalled();
  });
});

describe("RecurringService.update — split de série (dateStart < splitDate)", () => {
  it("délègue à repository.splitFromDate avec current, data, splitDate normalisé UTC minuit", async () => {
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

    const result = await service.update({
      id: RECURRING_ID as any,
      data: { dateToStartAction: "2026-06-15" } as any,
    });

    expect(result).toEqual(newRecurring);
  });
});

describe("RecurringService.update — propagation d'erreur", () => {
  it("lève NotFoundError si la récurrence n'existe pas", async () => {
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

// ── materializeOccurrence ──────────────────────────────────────────────────────

describe("RecurringService.materializeOccurrence", () => {
  it("crée toujours une exception sur originDate avant de matérialiser", async () => {
    const recurring = makeRecurring({
      kind: "AVAILABILITY",
      availabilty: { userId: "user-1", clinicId: "clinic-1" },
    });
    mockRepository.createException.mockResolvedValue(undefined);
    mockAvailabilityRepository.createPunctual.mockResolvedValue({
      id: "avail-punctual-1",
    });

    const originDate = new Date("2026-06-08T00:00:00.000Z");
    const targetDate = new Date("2026-06-08T00:00:00.000Z");

    await service.materializeOccurrence({ recurring, originDate, targetDate });

    expect(mockRepository.createException).toHaveBeenCalledWith({
      parentId: recurring.id,
      date: originDate,
      startTime: recurring.startTime,
      endTime: recurring.endTime,
      kind: recurring.kind,
    });
  });

  it("kind INTERNAL avec internalMeeting — délègue à internalMeetingRepository.createPunctual", async () => {
    const recurring = makeRecurring({
      kind: "INTERNAL",
      availabilty: null,
      internalMeeting: makeInternalMeeting(),
    });
    mockRepository.createException.mockResolvedValue(undefined);
    mockInternalMeetingRepository.createPunctual.mockResolvedValue({
      id: "internal-punctual-1",
    });

    const originDate = new Date("2026-06-08T00:00:00.000Z");
    const targetDate = new Date("2026-06-08T00:00:00.000Z");

    const result = await service.materializeOccurrence({
      recurring,
      originDate,
      targetDate,
    });

    expect(mockInternalMeetingRepository.createPunctual).toHaveBeenCalledWith({
      data: {
        title: recurring.internalMeeting!.title,
        description: recurring.internalMeeting!.description,
        date: targetDate,
        startTime: recurring.startTime,
        endTime: recurring.endTime,
        clinicId: recurring.internalMeeting!.clinicId,
        userIds: recurring.internalMeeting!.participants.map((p) => p.userId),
      },
      authorId: recurring.internalMeeting!.adminId,
      clinicId: recurring.internalMeeting!.clinicId,
      parentId: recurring.id,
    });
    expect(result).toEqual({ id: "internal-punctual-1" });
  });

  it("kind AVAILABILITY avec availabilty — délègue à availabilityRepository.createPunctual", async () => {
    const recurring = makeRecurring({ kind: "AVAILABILITY" });
    mockRepository.createException.mockResolvedValue(undefined);
    mockAvailabilityRepository.createPunctual.mockResolvedValue({
      id: "avail-punctual-1",
    });

    const originDate = new Date("2026-06-08T00:00:00.000Z");
    const targetDate = new Date("2026-06-09T00:00:00.000Z");

    const result = await service.materializeOccurrence({
      recurring,
      originDate,
      targetDate,
    });

    // ⚠️ createPunctual ne reçoit pas parentId ici (voir commentaire dans le service) :
    // l'occurrence matérialisée n'est donc pas reliée à sa récurrence d'origine côté disponibilité,
    // contrairement au cas INTERNAL. À vérifier si c'est voulu.
    expect(mockAvailabilityRepository.createPunctual).toHaveBeenCalledWith({
      data: {
        date: targetDate,
        startTime: recurring.startTime,
        endTime: recurring.endTime,
      },
      authorId: recurring.availabilty!.userId,
      clinicId: recurring.availabilty!.clinicId,
    });
    expect(result).toEqual({ id: "avail-punctual-1" });
  });

  it("kind INTERNAL sans internalMeeting attaché — NotFoundError", async () => {
    const recurring = makeRecurring({
      kind: "INTERNAL",
      availabilty: null,
      internalMeeting: null,
    });
    mockRepository.createException.mockResolvedValue(undefined);

    await expect(
      service.materializeOccurrence({
        recurring,
        originDate: new Date("2026-06-08T00:00:00.000Z"),
        targetDate: new Date("2026-06-08T00:00:00.000Z"),
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("kind AVAILABILITY sans availabilty attachée — NotFoundError", async () => {
    const recurring = makeRecurring({
      kind: "AVAILABILITY",
      availabilty: null,
    });
    mockRepository.createException.mockResolvedValue(undefined);

    await expect(
      service.materializeOccurrence({
        recurring,
        originDate: new Date("2026-06-08T00:00:00.000Z"),
        targetDate: new Date("2026-06-08T00:00:00.000Z"),
      }),
    ).rejects.toThrow(NotFoundError);
  });
});
