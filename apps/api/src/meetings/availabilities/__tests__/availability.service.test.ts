import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from "@api/errors";

const mockRepository = vi.hoisted(() => ({
  findByUser: vi.fn(),
  findById: vi.fn(),
  createRecurring: vi.fn(),
  createPunctual: vi.fn(),
  createExeption: vi.fn(),
  updatePunctual: vi.fn(),
  updateRecurring: vi.fn(),
  delete: vi.fn(),
  getAvailabilities: vi.fn(),
}));

const mockRecurringService = vi.hoisted(() => ({
  update: vi.fn(),
  getById: vi.fn(),
  materializeOccurrence: vi.fn(),
}));

const mockInternalMeetingService = vi.hoisted(() => ({
  getFlatsByUser: vi.fn(),
}));

const mockAnimalMeetingService = vi.hoisted(() => ({
  getAnimalMeetingsAsVet: vi.fn(),
}));

const mockVeterinarianRepository = vi.hoisted(() => ({
  findById: vi.fn(),
}));

vi.mock("../availability.repository", () => ({
  AvailabilityRepository: vi.fn(function () {
    return mockRepository;
  }),
}));
vi.mock("../../recurring-meeting/recurring-meeting.service", () => ({
  RecurringService: vi.fn(function () {
    return mockRecurringService;
  }),
}));
vi.mock("../../internal-meeting", () => ({
  InternalMeetingService: vi.fn(function () {
    return mockInternalMeetingService;
  }),
}));
vi.mock("../../animal-meeting", () => ({
  AnimalMeetingService: vi.fn(function () {
    return mockAnimalMeetingService;
  }),
}));
vi.mock("@api/veterinarians/veterinarian-profile.repository", () => ({
  VeterinarianProfileRepository: vi.fn(function () {
    return mockVeterinarianRepository;
  }),
}));

const { AvailabilityRepository } = await import("../availability.repository");
const { RecurringService } =
  await import("../../recurring-meeting/recurring-meeting.service");
const { InternalMeetingService } = await import("../../internal-meeting");
const { AnimalMeetingService } = await import("../../animal-meeting");
const { VeterinarianProfileRepository } =
  await import("@api/veterinarians/veterinarian-profile.repository");
const { AvailabilityService } = await import("../availability.service");

const service = new AvailabilityService(
  new AvailabilityRepository({} as any),
  new RecurringService({} as any, {} as any, {} as any),
  new InternalMeetingService({} as any, {} as any, {} as any, {} as any),
  new AnimalMeetingService({} as any, {} as any, {} as any),
  new VeterinarianProfileRepository({} as any),
);

beforeEach(() => vi.clearAllMocks());

const USER_ID = "user-1";
const CLINIC_ID = "clinic-1";

const makeAvailability = (overrides = {}) => ({
  id: "availability-1",
  userId: USER_ID,
  clinicId: CLINIC_ID,
  meetingId: null,
  recurringId: null,
  meeting: null,
  recurring: null,
  ...overrides,
});

// ── create ───────────────────────────────────────────────────────────────────

describe("AvailabilityService.create", () => {
  it("type RECURRING — délègue à createRecurring", async () => {
    const data = { type: "RECURRING", frequency: "WEEKLY" } as any;
    mockRepository.createRecurring.mockResolvedValue(makeAvailability());

    const result = await service.create({
      data,
      authorId: USER_ID,
      clinicId: CLINIC_ID,
    });

    expect(mockRepository.createRecurring).toHaveBeenCalledWith({
      data,
      authorId: USER_ID,
      clinicId: CLINIC_ID,
    });
    expect(mockRepository.createExeption).not.toHaveBeenCalled();
    expect(mockRepository.createPunctual).not.toHaveBeenCalled();
    expect(result).toBeDefined();
  });

  it("type EXCEPTION — délègue à createExeption", async () => {
    const data = { type: "EXCEPTION", parentId: "parent-1" } as any;
    mockRepository.createExeption.mockResolvedValue(makeAvailability());

    await service.create({ data, authorId: USER_ID, clinicId: CLINIC_ID });

    expect(mockRepository.createExeption).toHaveBeenCalledWith({
      data,
      authorId: USER_ID,
      clinicId: CLINIC_ID,
    });
  });

  it("type SPECIFIED — délègue à createPunctual", async () => {
    const data = { type: "SPECIFIED", date: new Date() } as any;
    mockRepository.createPunctual.mockResolvedValue(makeAvailability());

    await service.create({ data, authorId: USER_ID, clinicId: CLINIC_ID });

    expect(mockRepository.createPunctual).toHaveBeenCalledWith({
      data,
      authorId: USER_ID,
      clinicId: CLINIC_ID,
    });
  });
});

// ── getById ──────────────────────────────────────────────────────────────────

describe("AvailabilityService.getById", () => {
  it("CLIENT — ForbiddenError avant toute lecture", async () => {
    await expect(
      service.getById({
        id: "availability-1",
        role: "CLIENT" as any,
        userId: USER_ID,
      }),
    ).rejects.toThrow(ForbiddenError);
    expect(mockRepository.findById).not.toHaveBeenCalled();
  });

  it("introuvable — NotFoundError", async () => {
    mockRepository.findById.mockResolvedValue(null);
    await expect(
      service.getById({
        id: "unknown",
        role: "VETERINARIAN" as any,
        userId: USER_ID,
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("appartient à un autre utilisateur — ForbiddenError", async () => {
    mockRepository.findById.mockResolvedValue(
      makeAvailability({ userId: "other-user" }),
    );

    await expect(
      service.getById({
        id: "availability-1",
        role: "VETERINARIAN" as any,
        userId: USER_ID,
      }),
    ).rejects.toThrow(ForbiddenError);
  });

  it("retourne la disponibilité trouvée", async () => {
    mockRepository.findById.mockResolvedValue(makeAvailability());

    const result = await service.getById({
      id: "availability-1",
      role: "VETERINARIAN" as any,
      userId: USER_ID,
    });

    expect(result.id).toBe("availability-1");
  });
});

// ── update ───────────────────────────────────────────────────────────────────

describe("AvailabilityService.update", () => {
  it("propage NotFoundError depuis getById", async () => {
    mockRepository.findById.mockResolvedValue(null);

    await expect(
      service.update({
        id: "unknown",
        data: { type: "PUNCTUAL" } as any,
        userId: USER_ID,
        role: "VETERINARIAN" as any,
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("propage ForbiddenError si l'utilisateur n'est pas propriétaire", async () => {
    mockRepository.findById.mockResolvedValue(
      makeAvailability({ userId: "other-user" }),
    );

    await expect(
      service.update({
        id: "availability-1",
        data: { type: "PUNCTUAL" } as any,
        userId: USER_ID,
        role: "VETERINARIAN" as any,
      }),
    ).rejects.toThrow(ForbiddenError);
  });

  it("type PUNCTUAL — ConflictError si meetingId absent", async () => {
    mockRepository.findById.mockResolvedValue(
      makeAvailability({ meetingId: null }),
    );

    await expect(
      service.update({
        id: "availability-1",
        data: { type: "PUNCTUAL", startTime: "09:00" } as any,
        userId: USER_ID,
        role: "VETERINARIAN" as any,
      }),
    ).rejects.toThrow(ConflictError);
    expect(mockRepository.updatePunctual).not.toHaveBeenCalled();
  });

  it("type PUNCTUAL — appelle updatePunctual avec le meetingId existant", async () => {
    mockRepository.findById
      .mockResolvedValueOnce(makeAvailability({ meetingId: "meeting-1" }))
      .mockResolvedValueOnce(makeAvailability({ meetingId: "meeting-1" }));
    mockRepository.updatePunctual.mockResolvedValue(undefined);

    const data = {
      type: "PUNCTUAL",
      startTime: "09:00",
      endTime: "10:00",
    } as any;
    await service.update({
      id: "availability-1",
      data,
      userId: USER_ID,
      role: "VETERINARIAN" as any,
    });

    expect(mockRepository.updatePunctual).toHaveBeenCalledWith({
      id: "meeting-1",
      data,
    });
  });

  it("type RECURRING — ConflictError si recurringId absent", async () => {
    mockRepository.findById.mockResolvedValue(
      makeAvailability({ recurringId: null }),
    );

    await expect(
      service.update({
        id: "availability-1",
        data: { type: "RECURRING", startTime: "09:00" } as any,
        userId: USER_ID,
        role: "VETERINARIAN" as any,
      }),
    ).rejects.toThrow(ConflictError);
    expect(mockRecurringService.update).not.toHaveBeenCalled();
  });

  it("type RECURRING, scope non précisé — délègue à recurringService.update avec recurringId/type retirés", async () => {
    mockRepository.findById
      .mockResolvedValueOnce(makeAvailability({ recurringId: "recurring-1" }))
      .mockResolvedValueOnce(makeAvailability({ recurringId: "recurring-1" }));
    mockRecurringService.update.mockResolvedValue(undefined);

    const data = {
      type: "RECURRING",
      recurringId: "should-be-stripped",
      startTime: "09:00",
    } as any;
    await service.update({
      id: "availability-1",
      data,
      userId: USER_ID,
      role: "VETERINARIAN" as any,
    });

    expect(mockRecurringService.update).toHaveBeenCalledWith({
      id: "recurring-1",
      data: { startTime: "09:00" },
    });
  });

  it("type RECURRING, scope 'single' sans date — BadRequestError", async () => {
    mockRepository.findById.mockResolvedValue(
      makeAvailability({ recurringId: "recurring-1" }),
    );

    await expect(
      service.update({
        id: "availability-1",
        data: { type: "RECURRING" } as any,
        userId: USER_ID,
        role: "VETERINARIAN" as any,
        scope: "single",
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it("type RECURRING, scope 'single' avec date — matérialise l'occurrence", async () => {
    mockRepository.findById
      .mockResolvedValueOnce(makeAvailability({ recurringId: "recurring-1" }))
      .mockResolvedValueOnce(makeAvailability({ recurringId: "recurring-1" }));
    mockRecurringService.getById.mockResolvedValue({ id: "recurring-1" });
    mockRecurringService.materializeOccurrence.mockResolvedValue({
      id: "materialized-1",
    });

    const date = new Date("2026-06-08");
    await service.update({
      id: "availability-1",
      data: { type: "RECURRING" } as any,
      userId: USER_ID,
      role: "VETERINARIAN" as any,
      scope: "single",
      date,
    });

    expect(mockRecurringService.getById).toHaveBeenCalledWith("recurring-1");
    // ⚠️ targetDate n'est pas transmis ici (seulement originDate: date) — voir
    // recurring-meeting.service.test.ts où materializeOccurrence requiert targetDate.
    // À vérifier si ce comportement est volontaire (targetDate === originDate implicite)
    // ou un oubli côté appel.
    expect(mockRecurringService.materializeOccurrence).toHaveBeenCalledWith({
      recurring: { id: "recurring-1" },
      originDate: date,
      targetDate: date,
    });
  });

  it("retourne l'état rafraîchi (issu du second appel à getById)", async () => {
    mockRepository.findById
      .mockResolvedValueOnce(makeAvailability({ meetingId: "meeting-1" }))
      .mockResolvedValueOnce(
        makeAvailability({
          meetingId: "meeting-1",
          id: "availability-1-refreshed",
        }),
      );
    mockRepository.updatePunctual.mockResolvedValue(undefined);

    const result = await service.update({
      id: "availability-1",
      data: { type: "PUNCTUAL", startTime: "09:00" } as any,
      userId: USER_ID,
      role: "VETERINARIAN" as any,
    });

    expect(result.id).toBe("availability-1-refreshed");
  });
});

// ── delete ───────────────────────────────────────────────────────────────────

describe("AvailabilityService.delete", () => {
  it("introuvable — NotFoundError", async () => {
    mockRepository.findById.mockResolvedValue(null);
    await expect(
      service.delete({ id: "unknown", authorId: USER_ID }),
    ).rejects.toThrow(NotFoundError);
  });

  it("appartient à un autre utilisateur — ForbiddenError", async () => {
    mockRepository.findById.mockResolvedValue(
      makeAvailability({ userId: "other-user" }),
    );

    await expect(
      service.delete({ id: "availability-1", authorId: USER_ID }),
    ).rejects.toThrow(ForbiddenError);
    expect(mockRepository.delete).not.toHaveBeenCalled();
  });

  it("supprime la disponibilité du propriétaire", async () => {
    mockRepository.findById.mockResolvedValue(makeAvailability());
    mockRepository.delete.mockResolvedValue(undefined);

    await service.delete({ id: "availability-1", authorId: USER_ID });

    expect(mockRepository.delete).toHaveBeenCalledWith("availability-1");
  });
});

// ── getAll ───────────────────────────────────────────────────────────────────

describe("AvailabilityService.getAll", () => {
  it("délègue au repository avec userId et date", async () => {
    const date = new Date("2026-06-01");
    mockRepository.findByUser.mockResolvedValue([makeAvailability()]);

    const result = await service.getAll({ userId: USER_ID as any, date });

    expect(mockRepository.findByUser).toHaveBeenCalledWith({
      userId: USER_ID,
      date,
    });
    expect(result).toHaveLength(1);
  });
});

// ── getAvailabilities ─────────────────────────────────────────────────────────

describe("AvailabilityService.getAvailabilities", () => {
  const start = new Date("2026-01-01T00:00:00.000Z");
  const end = new Date("2026-01-31T00:00:00.000Z");

  it("aplatit et étend recurring/meeting via expandAll", async () => {
    mockRepository.getAvailabilities.mockResolvedValue([
      { recurring: null, meeting: null },
    ]);

    const result = await service.getAvailabilities({
      userId: USER_ID,
      start,
      end,
    });

    expect(mockRepository.getAvailabilities).toHaveBeenCalledWith({
      userId: USER_ID,
      start,
      end,
      clinicIds: undefined,
    });
    expect(result).toHaveLength(0);
  });

  it("propage clinicIds au repository", async () => {
    mockRepository.getAvailabilities.mockResolvedValue([]);

    await service.getAvailabilities({
      userId: USER_ID,
      start,
      end,
      clinicIds: ["clinic-1" as any],
    });

    expect(mockRepository.getAvailabilities).toHaveBeenCalledWith({
      userId: USER_ID,
      start,
      end,
      clinicIds: ["clinic-1"],
    });
  });
});

// ── sliceAvailabilityIntoSlots ────────────────────────────────────────────────

describe("AvailabilityService.sliceAvailabilityIntoSlots", () => {
  it("découpe une disponibilité en créneaux libres, en excluant les créneaux occupés", () => {
    const availability = {
      startTime: new Date("1970-01-01T08:00:00.000Z"),
      endTime: new Date("1970-01-01T10:00:00.000Z"),
      date: new Date("2026-06-01T00:00:00.000Z"),
    } as any;
    const occupied = [
      {
        start: new Date("1970-01-01T08:30:00.000Z"),
        end: new Date("1970-01-01T09:00:00.000Z"),
      },
    ];

    const slots = service.sliceAvailabilityIntoSlots(
      availability,
      occupied,
      30,
    );

    expect(slots).toHaveLength(3); // 08:00-08:30, 09:00-09:30, 09:30-10:00
    const occupiedSlot = slots.find(
      (s) => s.startTime.toISOString() === "1970-01-01T08:30:00.000Z",
    );
    expect(occupiedSlot).toBeUndefined();
  });

  it("utilise slotDurationMinutes personnalisé", () => {
    const availability = {
      startTime: new Date("1970-01-01T08:00:00.000Z"),
      endTime: new Date("1970-01-01T09:00:00.000Z"),
      date: new Date("2026-06-01T00:00:00.000Z"),
    } as any;

    const slots = service.sliceAvailabilityIntoSlots(availability, [], 15);

    expect(slots).toHaveLength(4);
  });

  it("aucun créneau si la disponibilité est plus courte que slotDurationMinutes", () => {
    const availability = {
      startTime: new Date("1970-01-01T08:00:00.000Z"),
      endTime: new Date("1970-01-01T08:10:00.000Z"),
      date: new Date("2026-06-01T00:00:00.000Z"),
    } as any;

    const slots = service.sliceAvailabilityIntoSlots(availability, [], 30);

    expect(slots).toHaveLength(0);
  });
});

// ── getAvailabilityTimeline ───────────────────────────────────────────────────

describe("AvailabilityService.getAvailabilityTimeline", () => {
  const start = new Date("2026-01-01T00:00:00.000Z");
  const end = new Date("2026-01-31T00:00:00.000Z");

  it("veterinarian introuvable — NotFoundError", async () => {
    mockVeterinarianRepository.findById.mockResolvedValue(null);

    await expect(
      service.getAvailabilityTimeline({
        veterinarianId: "vet-1" as any,
        start,
        end,
        userId: "user-1" as any,
        role: "VETERINARIAN" as any,
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("retourne windows et busy à partir des clinicIds du véto", async () => {
    mockVeterinarianRepository.findById.mockResolvedValue({
      veterinarianClinics: [{ clinicId: "clinic-1" }],
    });
    mockRepository.getAvailabilities.mockResolvedValue([]);
    mockInternalMeetingService.getFlatsByUser.mockResolvedValue([]);
    mockAnimalMeetingService.getAnimalMeetingsAsVet.mockResolvedValue([]);

    const result = await service.getAvailabilityTimeline({
      veterinarianId: "vet-1" as any,
      start,
      end,
      userId: "user-1" as any,
      role: "VETERINARIAN" as any,
    });

    expect(mockInternalMeetingService.getFlatsByUser).toHaveBeenCalledWith(
      "vet-1",
      start,
      end,
      ["clinic-1"],
    );
    expect(result.windows).toHaveLength(0);
    expect(result.busy).toHaveLength(0);
  });
});
