import { describe, it, expect, vi, beforeEach } from "vitest";
import { ConflictError, ForbiddenError, NotFoundError } from "@api/errors";

const mockRepository = vi.hoisted(() => ({
  findByUser: vi.fn(),
  findById: vi.fn(),
  createRecurring: vi.fn(),
  createPunctual: vi.fn(),
  createExeption: vi.fn(),
  updatePunctual: vi.fn(),
  updateRecurring: vi.fn(),
  delete: vi.fn(),
  getVetSlots: vi.fn(),
}));

const mockRecurringService = vi.hoisted(() => ({
  update: vi.fn(),
  getById: vi.fn(),
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

const { AvailabilityRepository } = await import("../availability.repository");
const { RecurringService } =
  await import("../../recurring-meeting/recurring-meeting.service");
const { AvailabilityService } = await import("../availability.service");

const service = new AvailabilityService(
  new AvailabilityRepository({} as any),
  new RecurringService({} as any, {} as any),
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
        role: "CLIENT",
        userId: USER_ID,
      }),
    ).rejects.toThrow(ForbiddenError);
    expect(mockRepository.findById).not.toHaveBeenCalled();
  });

  it("introuvable — NotFoundError", async () => {
    mockRepository.findById.mockResolvedValue(null);

    await expect(
      service.getById({ id: "unknown", role: "VETERINARIAN", userId: USER_ID }),
    ).rejects.toThrow(NotFoundError);
  });

  it("appartient à un autre utilisateur — ForbiddenError", async () => {
    mockRepository.findById.mockResolvedValue(
      makeAvailability({ userId: "other-user" }),
    );

    await expect(
      service.getById({
        id: "availability-1",
        role: "VETERINARIAN",
        userId: USER_ID,
      }),
    ).rejects.toThrow(ForbiddenError);
  });

  it("retourne la disponibilité trouvée", async () => {
    mockRepository.findById.mockResolvedValue(makeAvailability());

    const result = await service.getById({
      id: "availability-1",
      role: "VETERINARIAN",
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
        role: "VETERINARIAN",
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
        role: "VETERINARIAN",
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
        role: "VETERINARIAN",
      }),
    ).rejects.toThrow(ConflictError);
    expect(mockRepository.updatePunctual).not.toHaveBeenCalled();
  });

  it("type PUNCTUAL — appelle updatePunctual avec le meetingId existant (le champ 'type' n'est pas retiré du payload)", async () => {
    mockRepository.findById
      .mockResolvedValueOnce(makeAvailability({ meetingId: "meeting-1" })) // getById avant update
      .mockResolvedValueOnce(makeAvailability({ meetingId: "meeting-1" })); // getById après update (refetch)
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
      role: "VETERINARIAN",
    });

    expect(mockRepository.updatePunctual).toHaveBeenCalledWith({
      id: "meeting-1",
      data, // 'type' toujours présent — comportement actuel du service, pas filtré
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
        role: "VETERINARIAN",
      }),
    ).rejects.toThrow(ConflictError);
    expect(mockRecurringService.update).not.toHaveBeenCalled();
  });

  it("type RECURRING — délègue à recurringService.update avec recurringId/type retirés du payload", async () => {
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
      role: "VETERINARIAN",
    });

    expect(mockRecurringService.update).toHaveBeenCalledWith({
      id: "recurring-1",
      data: { startTime: "09:00" }, // type et recurringId retirés
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
      role: "VETERINARIAN",
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

    const result = await service.getAll({ userId: USER_ID, date });

    expect(mockRepository.findByUser).toHaveBeenCalledWith({
      userId: USER_ID,
      date,
    });
    expect(result).toHaveLength(1);
  });
});
