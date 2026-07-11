import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from "@api/errors";

const mockRepository = vi.hoisted(() => ({
  findById: vi.fn(),
  createPunctual: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  createOccurrenceOverride: vi.fn(),
  createException: vi.fn(),
  deleteRecurring: vi.fn(),
  truncateRecurring: vi.fn(),
  deleteFutureChildren: vi.fn(),
  findByUser: vi.fn(),
}));

const mockParticipantRepository = vi.hoisted(() => ({
  copyStatus: vi.fn(),
  findByKeys: vi.fn(),
  updateStatus: vi.fn(),
  findByUserAndClinicIds: vi.fn(),
}));

const mockRecurringService = vi.hoisted(() => ({
  update: vi.fn(),
  getById: vi.fn(),
  materializeOccurrence: vi.fn(),
}));

const mockClinicService = vi.hoisted(() => ({
  getClinicIdsByUserId: vi.fn(),
}));

const mockSafeParse = vi.hoisted(() => vi.fn());

vi.mock("../internal-meeting.repository", () => ({
  InternalMeetingRepository: vi.fn(function () {
    return mockRepository;
  }),
}));
vi.mock("../participant.repository", () => ({
  InternalMeetingParticipantRepository: vi.fn(function () {
    return mockParticipantRepository;
  }),
}));
vi.mock("../../recurring-meeting/recurring-meeting.service", () => ({
  RecurringService: vi.fn(function () {
    return mockRecurringService;
  }),
}));
vi.mock("@api/clinics/clinic.service", () => ({
  ClinicService: vi.fn(function () {
    return mockClinicService;
  }),
}));
vi.mock("@armali/schemas", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@armali/schemas")>();
  return {
    ...actual,
    createInternalMeetingSchema: { safeParse: mockSafeParse },
  };
});
vi.mock("@api/users/user.utils", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@api/users/user.utils")>();
  return {
    ...actual,
    withAvatarUrl: vi.fn((user) => ({ ...user, avatarUrl: null })),
  };
});

const { InternalMeetingRepository } =
  await import("../internal-meeting.repository");
const { InternalMeetingParticipantRepository } =
  await import("../participant.repository");
const { RecurringService } =
  await import("../../recurring-meeting/recurring-meeting.service");
const { ClinicService } = await import("@api/clinics/clinic.service");
const { InternalMeetingService } = await import("../internal-meeting.service");

const service = new InternalMeetingService(
  new InternalMeetingRepository({} as any),
  new InternalMeetingParticipantRepository({} as any),
  new RecurringService({} as any, {} as any, {} as any),
  new ClinicService({} as any),
);

beforeEach(() => {
  vi.clearAllMocks();
  process.env.ASSETS_BASE_URL = "http://localhost:9000/test-bucket";
});

const USER_ID = "user-1";
const OTHER_USER_ID = "user-2";
const CLINIC_ID = "clinic-1";

const makeInternalMeeting = (overrides = {}) =>
  ({
    id: "internal-meeting-1",
    meetingId: "meeting-base-1",
    recurringId: null,
    recurring: null,
    title: "Réunion",
    description: "Description",
    clinicId: CLINIC_ID,
    adminId: USER_ID,
    participants: [{ userId: USER_ID, status: "PENDING" }],
    ...overrides,
  }) as any;

// ── create ───────────────────────────────────────────────────────────────────

describe("InternalMeetingService.create", () => {
  it("ForbiddenError si la clinique demandée n'appartient pas à l'utilisateur", async () => {
    mockClinicService.getClinicIdsByUserId.mockResolvedValue(["other-clinic"]);

    await expect(
      service.create({
        data: { clinicId: CLINIC_ID } as any,
        userId: USER_ID as any,
        role: "VETERINARIAN" as any,
      }),
    ).rejects.toThrow(ForbiddenError);
    expect(mockRepository.createPunctual).not.toHaveBeenCalled();
  });

  it("délègue à repository.createPunctual si la clinique est autorisée", async () => {
    mockClinicService.getClinicIdsByUserId.mockResolvedValue([CLINIC_ID]);
    mockRepository.createPunctual.mockResolvedValue(makeInternalMeeting());

    const data = { clinicId: CLINIC_ID, title: "Nouvelle réunion" } as any;
    await service.create({
      data,
      userId: USER_ID as any,
      role: "VETERINARIAN" as any,
    });

    expect(mockRepository.createPunctual).toHaveBeenCalledWith({
      data,
      authorId: USER_ID,
    });
  });
});

// ── update ───────────────────────────────────────────────────────────────────

describe("InternalMeetingService.update", () => {
  it("réunion introuvable — NotFoundError", async () => {
    mockRepository.findById.mockResolvedValue(null);

    await expect(
      service.update({
        id: "unknown",
        data: {} as any,
        userId: USER_ID,
        scope: "all",
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("utilisateur non-participant — ForbiddenError", async () => {
    mockRepository.findById.mockResolvedValue(
      makeInternalMeeting({
        participants: [{ userId: OTHER_USER_ID, status: "PENDING" }],
      }),
    );

    await expect(
      service.update({
        id: "meeting-base-1",
        data: {} as any,
        userId: USER_ID,
        scope: "all",
      }),
    ).rejects.toThrow(ForbiddenError);
  });

  it("pas de récurrence — update simple, comportement inchangé", async () => {
    mockRepository.findById.mockResolvedValue(
      makeInternalMeeting({ recurringId: null }),
    );
    mockRepository.update.mockResolvedValue(makeInternalMeeting());

    const data = { title: "Titre modifié" } as any;
    await service.update({
      id: "meeting-base-1",
      data,
      userId: USER_ID,
      scope: "all",
    });

    expect(mockRepository.update).toHaveBeenCalledWith({
      id: "meeting-base-1",
      data,
    });
    expect(mockRecurringService.update).not.toHaveBeenCalled();
  });

  it("récurrence présente mais originDate absente — BadRequestError", async () => {
    mockRepository.findById.mockResolvedValue(
      makeInternalMeeting({ recurringId: "recurring-1" }),
    );

    await expect(
      service.update({
        id: "meeting-base-1",
        data: {} as any,
        userId: USER_ID,
        scope: "all",
      }),
    ).rejects.toThrow(BadRequestError);
  });

  describe("scope 'all' — délègue au split de série", () => {
    it("sans changement de titre/description — pas de bloc 'internal' transmis", async () => {
      mockRepository.findById
        .mockResolvedValueOnce(
          makeInternalMeeting({ recurringId: "recurring-1" }),
        )
        .mockResolvedValueOnce(makeInternalMeeting());
      mockRecurringService.update.mockResolvedValue({ id: "new-recurring-1" });

      const date = new Date("2027-06-01");
      await service.update({
        id: "meeting-base-1",
        data: { startTime: new Date("2027-06-01T09:00:00Z") } as any,
        userId: USER_ID,
        scope: "all",
        originDate: date,
      });

      expect(mockRecurringService.update).toHaveBeenCalledWith({
        id: "recurring-1",
        data: {
          dateToStartAction: date,
          startTime: new Date("2027-06-01T09:00:00Z"),
          endTime: undefined,
          dateStart: undefined,
        },
      });
    });

    it("avec changement de titre — le bloc 'internal' est transmis avec fallback sur l'existant", async () => {
      mockRepository.findById
        .mockResolvedValueOnce(
          makeInternalMeeting({
            recurringId: "recurring-1",
            title: "Ancien titre",
            description: "Ancienne description",
            participants: [
              { userId: USER_ID, status: "ACCEPTED" },
              { userId: OTHER_USER_ID, status: "PENDING" },
            ],
          }),
        )
        .mockResolvedValueOnce(makeInternalMeeting());
      mockRecurringService.update.mockResolvedValue({ id: "new-recurring-1" });

      const date = new Date("2027-06-01");
      await service.update({
        id: "meeting-base-1",
        data: { title: "Nouveau titre" } as any,
        userId: USER_ID,
        scope: "all",
        originDate: date,
      });

      expect(mockRecurringService.update).toHaveBeenCalledWith({
        id: "recurring-1",
        data: {
          dateToStartAction: date,
          startTime: undefined,
          endTime: undefined,
          dateStart: undefined,
          internal: {
            title: "Nouveau titre",
            description: "Ancienne description",
            userIds: [USER_ID, OTHER_USER_ID],
          },
        },
      });
    });

    it("retourne le résultat de findById sur le nouveau recurring.id", async () => {
      mockRepository.findById
        .mockResolvedValueOnce(
          makeInternalMeeting({ recurringId: "recurring-1" }),
        )
        .mockResolvedValueOnce(makeInternalMeeting({ id: "refreshed" }));
      mockRecurringService.update.mockResolvedValue({ id: "new-recurring-1" });

      const result = await service.update({
        id: "meeting-base-1",
        data: {} as any,
        userId: USER_ID,
        scope: "all",
        originDate: new Date("2027-06-01"),
      });

      expect(mockRepository.findById).toHaveBeenLastCalledWith(
        "new-recurring-1",
      );
      expect(result?.id).toBe("refreshed");
    });
  });

  describe("scope 'single' — occurrence déjà matérialisée (existing.meetingId non null)", () => {
    beforeEach(() => {
      mockSafeParse.mockReturnValue({
        success: true,
        data: {
          title: "Réunion",
          description: "Description",
          date: new Date("2027-06-01"),
          startTime: new Date("2027-06-01T09:00:00Z"),
          endTime: new Date("2027-06-01T10:00:00Z"),
          clinicId: CLINIC_ID,
          userIds: [USER_ID],
          parentId: "recurring-1",
        },
      });
    });

    it("recurring absent malgré recurringId — NotFoundError", async () => {
      mockRepository.findById.mockResolvedValue(
        makeInternalMeeting({
          recurringId: "recurring-1",
          recurring: null,
          meetingId: "meeting-base-1",
        }),
      );

      await expect(
        service.update({
          id: "meeting-base-1",
          data: {} as any,
          userId: USER_ID,
          scope: "single",
          originDate: new Date("2027-06-01"),
        }),
      ).rejects.toThrow(NotFoundError);
    });

    it("ConflictError si le safeParse échoue", async () => {
      mockSafeParse.mockReturnValue({
        success: false,
        error: new Error("invalid"),
      });
      mockRepository.findById.mockResolvedValue(
        makeInternalMeeting({
          recurringId: "recurring-1",
          recurring: {
            id: "recurring-1",
            startTime: new Date("2027-06-01T09:00:00Z"),
            endTime: new Date("2027-06-01T10:00:00Z"),
          },
          meetingId: "meeting-base-1",
        }),
      );

      await expect(
        service.update({
          id: "meeting-base-1",
          data: {} as any,
          userId: USER_ID,
          scope: "single",
          originDate: new Date("2027-06-01"),
        }),
      ).rejects.toThrow(ConflictError);
    });

    // ⚠️ BUG SUSPECTÉ (toujours présent) : repository.update({ id, ... }) retourne un
    // InternalMeeting (via prisma.internalMeeting.update), donc son .id est la PK propre
    // d'InternalMeeting — pas celle de MeetingBase. Le findById suivant reçoit cette PK,
    // alors que findById() ne matche que sur meetingId/recurringId (des FK vers MeetingBase/
    // MeetingReccuring). En pratique (hors mock), ce second findById retournera donc null.
    it("findById final est appelé avec l'id retourné par repository.update (PK InternalMeeting, pas MeetingBase.id)", async () => {
      const existing = makeInternalMeeting({
        recurringId: "recurring-1",
        recurring: {
          id: "recurring-1",
          startTime: new Date("2027-06-01T09:00:00Z"),
          endTime: new Date("2027-06-01T10:00:00Z"),
        },
        meetingId: "meeting-base-1",
      });
      mockRepository.findById
        .mockResolvedValueOnce(existing)
        .mockResolvedValueOnce(makeInternalMeeting());
      mockRepository.update.mockResolvedValue({ id: "internal-meeting-XYZ" });

      await service.update({
        id: "meeting-base-1",
        data: {} as any,
        userId: USER_ID,
        scope: "single",
        originDate: new Date("2027-06-01"),
      });

      expect(mockRepository.findById).toHaveBeenLastCalledWith(
        "internal-meeting-XYZ",
      );
    });

    it("copie les statuts des participants si !isRescheduling", async () => {
      const existing = makeInternalMeeting({
        recurringId: "recurring-1",
        recurring: {
          id: "recurring-1",
          startTime: new Date("2027-06-01T09:00:00Z"),
          endTime: new Date("2027-06-01T10:00:00Z"),
        },
        meetingId: "meeting-base-1",
      });
      mockRepository.findById
        .mockResolvedValueOnce(existing)
        .mockResolvedValueOnce(existing);
      mockRepository.update.mockResolvedValue({ id: "internal-meeting-1" });

      await service.update({
        id: "meeting-base-1",
        data: { title: "Nouveau titre" } as any,
        userId: USER_ID,
        scope: "single",
        originDate: new Date("2027-06-01"),
      });

      expect(mockParticipantRepository.copyStatus).toHaveBeenCalledWith({
        targetInternalMeetingId: "internal-meeting-1",
        sourceParticipants: existing.participants,
      });
    });

    it("ne copie pas les statuts si isRescheduling (date/heure modifiée)", async () => {
      const existing = makeInternalMeeting({
        recurringId: "recurring-1",
        recurring: {
          id: "recurring-1",
          startTime: new Date("2027-06-01T09:00:00Z"),
          endTime: new Date("2027-06-01T10:00:00Z"),
        },
        meetingId: "meeting-base-1",
      });
      mockRepository.findById
        .mockResolvedValueOnce(existing)
        .mockResolvedValueOnce(existing);
      mockRepository.update.mockResolvedValue({ id: "internal-meeting-1" });

      await service.update({
        id: "meeting-base-1",
        data: { startTime: new Date("2027-06-01T11:00:00Z") } as any,
        userId: USER_ID,
        scope: "single",
        originDate: new Date("2027-06-01"),
      });

      expect(mockParticipantRepository.copyStatus).not.toHaveBeenCalled();
    });
  });

  describe("scope 'single' — occurrence virtuelle (existing.meetingId null)", () => {
    beforeEach(() => {
      mockSafeParse.mockReturnValue({
        success: true,
        data: {
          title: "Réunion",
          description: "Description",
          date: new Date("2027-06-01"),
          startTime: new Date("2027-06-01T09:00:00Z"),
          endTime: new Date("2027-06-01T10:00:00Z"),
          clinicId: CLINIC_ID,
          userIds: [USER_ID],
          parentId: "recurring-1",
        },
      });
    });

    it("matérialise l'occurrence via recurringService, findById avec le bon MeetingBase.id", async () => {
      const existing = makeInternalMeeting({
        recurringId: "recurring-1",
        recurring: {
          id: "recurring-1",
          startTime: new Date("2027-06-01T09:00:00Z"),
          endTime: new Date("2027-06-01T10:00:00Z"),
        },
        meetingId: null,
      });
      const fullRecurring = { id: "recurring-1", kind: "INTERNAL" };
      mockRepository.findById
        .mockResolvedValueOnce(existing)
        .mockResolvedValueOnce(existing);
      mockRecurringService.getById.mockResolvedValue(fullRecurring);
      mockRecurringService.materializeOccurrence.mockResolvedValue({
        id: "new-meeting-base-1",
      });

      await service.update({
        id: "meeting-base-1",
        data: {} as any,
        userId: USER_ID,
        scope: "single",
        originDate: new Date("2027-06-01"),
      });

      expect(mockRecurringService.getById).toHaveBeenCalledWith("recurring-1");
      expect(mockRecurringService.materializeOccurrence).toHaveBeenCalledWith({
        recurring: fullRecurring,
        originDate: new Date("2027-06-01"),
        targetDate: new Date("2027-06-01"),
      });
      expect(mockRepository.findById).toHaveBeenLastCalledWith(
        "new-meeting-base-1",
      );
    });

    it("copie les statuts si !isRescheduling", async () => {
      const existing = makeInternalMeeting({
        recurringId: "recurring-1",
        recurring: {
          id: "recurring-1",
          startTime: new Date("2027-06-01T09:00:00Z"),
          endTime: new Date("2027-06-01T10:00:00Z"),
        },
        meetingId: null,
      });
      mockRepository.findById
        .mockResolvedValueOnce(existing)
        .mockResolvedValueOnce(existing);
      mockRecurringService.getById.mockResolvedValue({
        id: "recurring-1",
        kind: "INTERNAL",
      });
      mockRecurringService.materializeOccurrence.mockResolvedValue({
        id: "new-meeting-base-1",
      });

      await service.update({
        id: "meeting-base-1",
        data: { title: "Nouveau titre" } as any,
        userId: USER_ID,
        scope: "single",
        originDate: new Date("2027-06-01"),
      });

      expect(mockParticipantRepository.copyStatus).toHaveBeenCalledWith({
        targetInternalMeetingId: "new-meeting-base-1",
        sourceParticipants: existing.participants,
      });
    });
  });
});

// ── delete ───────────────────────────────────────────────────────────────────

describe("InternalMeetingService.delete", () => {
  it("réunion introuvable — NotFoundError", async () => {
    mockRepository.findById.mockResolvedValue(null);
    await expect(
      service.delete({ id: "unknown", userId: USER_ID, scope: "all" }),
    ).rejects.toThrow(NotFoundError);
  });

  it("utilisateur non-admin — ForbiddenError", async () => {
    mockRepository.findById.mockResolvedValue(
      makeInternalMeeting({ adminId: OTHER_USER_ID }),
    );
    await expect(
      service.delete({ id: "meeting-base-1", userId: USER_ID, scope: "all" }),
    ).rejects.toThrow(ForbiddenError);
  });

  it("pas de récurrence — suppression simple", async () => {
    mockRepository.findById.mockResolvedValue(
      makeInternalMeeting({ id: "internal-meeting-1", recurringId: null }),
    );
    mockRepository.delete.mockResolvedValue(undefined);

    await service.delete({
      id: "meeting-base-1",
      userId: USER_ID,
      scope: "all",
    });

    expect(mockRepository.delete).toHaveBeenCalledWith("internal-meeting-1");
  });

  it("récurrence présente mais date absente — BadRequestError", async () => {
    mockRepository.findById.mockResolvedValue(
      makeInternalMeeting({ recurringId: "recurring-1" }),
    );

    await expect(
      service.delete({ id: "meeting-base-1", userId: USER_ID, scope: "all" }),
    ).rejects.toThrow(BadRequestError);
  });

  it("scope 'all' — supprime les occurrences futures et raccourcit la série", async () => {
    mockRepository.findById.mockResolvedValue(
      makeInternalMeeting({ recurringId: "recurring-1" }),
    );
    mockRepository.deleteFutureChildren.mockResolvedValue(undefined);
    mockRepository.truncateRecurring.mockResolvedValue(undefined);

    const date = new Date("2027-06-15T00:00:00.000Z");
    await service.delete({
      id: "meeting-base-1",
      userId: USER_ID,
      scope: "all",
      date,
    });

    expect(mockRepository.deleteFutureChildren).toHaveBeenCalledWith(
      "recurring-1",
      date,
    );
    expect(mockRepository.truncateRecurring).toHaveBeenCalledTimes(1);
    const [, dayBeforeArg] = mockRepository.truncateRecurring.mock.calls[0];
    // ⚠️ dayBeforeDate est calculé avec setDate(-1) en heure locale du serveur — mêmes
    // risques de décalage jour que ceux vus dans expandRecurring si l'heure croise minuit.
    expect(dayBeforeArg.getTime()).toBeLessThan(date.getTime());
  });

  it("scope 'single' — recurring absent malgré recurringId — NotFoundError", async () => {
    mockRepository.findById.mockResolvedValue(
      makeInternalMeeting({ recurringId: "recurring-1", recurring: null }),
    );

    await expect(
      service.delete({
        id: "meeting-base-1",
        userId: USER_ID,
        scope: "single",
        date: new Date("2027-06-01"),
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("scope 'single' — crée une exception sur la date d'origine", async () => {
    const existing = makeInternalMeeting({
      recurringId: "recurring-1",
      recurring: {
        id: "recurring-1",
        startTime: new Date("2027-06-01T09:00:00Z"),
        endTime: new Date("2027-06-01T10:00:00Z"),
      },
    });
    mockRepository.findById.mockResolvedValue(existing);
    mockRepository.createException.mockResolvedValue(undefined);

    const date = new Date("2027-06-15");
    await service.delete({
      id: "meeting-base-1",
      userId: USER_ID,
      scope: "single",
      date,
    });

    expect(mockRepository.createException).toHaveBeenCalledWith({
      parentId: "recurring-1",
      date,
      startTime: existing.recurring?.startTime,
      endTime: existing.recurring?.endTime,
    });
  });
});

// ── getById ──────────────────────────────────────────────────────────────────

describe("InternalMeetingService.getById", () => {
  it("CLIENT — ForbiddenError", async () => {
    await expect(
      service.getById({ id: "meeting-1", role: "CLIENT" as any }),
    ).rejects.toThrow(ForbiddenError);
    expect(mockRepository.findById).not.toHaveBeenCalled();
  });

  it("introuvable — NotFoundError", async () => {
    mockRepository.findById.mockResolvedValue(null);
    await expect(
      service.getById({ id: "unknown", role: "VETERINARIAN" as any }),
    ).rejects.toThrow(NotFoundError);
  });

  it("applique withAvatarUrl et clinicId à chaque participant", async () => {
    mockRepository.findById.mockResolvedValue(
      makeInternalMeeting({
        clinicId: CLINIC_ID,
        participants: [
          {
            userId: USER_ID,
            status: "PENDING",
            user: { id: USER_ID, avatar: null },
          },
        ],
      }),
    );

    const result = await service.getById({
      id: "meeting-1",
      role: "VETERINARIAN" as any,
    });

    expect(result.participants[0].user).toMatchObject({
      id: USER_ID,
      clinicId: CLINIC_ID,
    });
  });
});

// ── updateParticipantStatus ──────────────────────────────────────────────────

describe("InternalMeetingService.updateParticipantStatus", () => {
  it("réunion introuvable — NotFoundError", async () => {
    mockRepository.findById.mockResolvedValue(null);
    await expect(
      service.updateParticipantStatus({
        meetingId: "unknown",
        userId: USER_ID,
        status: "ACCEPTED",
        scope: "all",
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("utilisateur non-participant — ForbiddenError", async () => {
    mockRepository.findById.mockResolvedValue(
      makeInternalMeeting({
        participants: [{ userId: OTHER_USER_ID, status: "PENDING" }],
      }),
    );

    await expect(
      service.updateParticipantStatus({
        meetingId: "meeting-1",
        userId: USER_ID,
        status: "ACCEPTED",
        scope: "all",
      }),
    ).rejects.toThrow(ForbiddenError);
  });

  describe("cas 1 — MeetingBase concret (pas de récurrence)", () => {
    it("participant introuvable côté participantRepository — ForbiddenError", async () => {
      mockRepository.findById.mockResolvedValue(
        makeInternalMeeting({ id: "internal-meeting-1", recurringId: null }),
      );
      mockParticipantRepository.findByKeys.mockResolvedValue(null);

      await expect(
        service.updateParticipantStatus({
          meetingId: "meeting-1",
          userId: USER_ID,
          status: "ACCEPTED",
          scope: "all",
        }),
      ).rejects.toThrow(ForbiddenError);
    });

    it("met à jour le statut du participant", async () => {
      mockRepository.findById.mockResolvedValue(
        makeInternalMeeting({ id: "internal-meeting-1", recurringId: null }),
      );
      mockParticipantRepository.findByKeys.mockResolvedValue({
        userId: USER_ID,
        status: "PENDING",
      });
      mockParticipantRepository.updateStatus.mockResolvedValue(undefined);

      await service.updateParticipantStatus({
        meetingId: "meeting-1",
        userId: USER_ID,
        status: "ACCEPTED",
        scope: "all",
      });

      expect(mockParticipantRepository.updateStatus).toHaveBeenCalledWith({
        userId: USER_ID,
        internalMeetingId: "internal-meeting-1",
        status: "ACCEPTED",
      });
    });
  });

  describe("cas 2 — récurrence, scope 'all'", () => {
    it("met à jour le statut par défaut pour toute la série", async () => {
      mockRepository.findById.mockResolvedValue(
        makeInternalMeeting({
          id: "internal-meeting-1",
          recurringId: "recurring-1",
        }),
      );
      mockParticipantRepository.updateStatus.mockResolvedValue(undefined);

      await service.updateParticipantStatus({
        meetingId: "recurring-1",
        userId: USER_ID,
        status: "DECLINED",
        scope: "all",
      });

      expect(mockParticipantRepository.updateStatus).toHaveBeenCalledWith({
        internalMeetingId: "internal-meeting-1",
        userId: USER_ID,
        status: "DECLINED",
      });
    });
  });

  describe("cas 2 — récurrence, scope 'single'", () => {
    it("date absente — BadRequestError", async () => {
      mockRepository.findById.mockResolvedValue(
        makeInternalMeeting({ recurringId: "recurring-1" }),
      );

      await expect(
        service.updateParticipantStatus({
          meetingId: "recurring-1",
          userId: USER_ID,
          status: "ACCEPTED",
          scope: "single",
        }),
      ).rejects.toThrow(BadRequestError);
    });

    it("recurring absent malgré recurringId — NotFoundError", async () => {
      mockRepository.findById.mockResolvedValue(
        makeInternalMeeting({ recurringId: "recurring-1", recurring: null }),
      );

      await expect(
        service.updateParticipantStatus({
          meetingId: "recurring-1",
          userId: USER_ID,
          status: "ACCEPTED",
          scope: "single",
          date: new Date("2027-06-01"),
        }),
      ).rejects.toThrow(NotFoundError);
    });

    it("crée un override pour cette occurrence précise", async () => {
      const existing = makeInternalMeeting({
        recurringId: "recurring-1",
        recurring: { id: "recurring-1" },
      });
      mockRepository.findById.mockResolvedValue(existing);
      mockRepository.createOccurrenceOverride.mockResolvedValue(undefined);

      const date = new Date("2027-06-01");
      await service.updateParticipantStatus({
        meetingId: "recurring-1",
        userId: USER_ID,
        status: "ACCEPTED",
        scope: "single",
        date,
      });

      expect(mockRepository.createOccurrenceOverride).toHaveBeenCalledWith({
        internalMeeting: { ...existing, recurring: existing.recurring },
        date,
        userId: USER_ID,
        status: "ACCEPTED",
      });
    });
  });
});

// ── getFlatsByUser ────────────────────────────────────────────────────────────

describe("InternalMeetingService.getFlatsByUser", () => {
  it("délègue à participantRepository puis étend via expandAll", async () => {
    const start = new Date("2026-01-01T00:00:00.000Z");
    const end = new Date("2026-01-31T00:00:00.000Z");
    mockParticipantRepository.findByUserAndClinicIds.mockResolvedValue([
      { meeting: { recurring: null, meeting: null } },
    ]);

    const result = await service.getFlatsByUser(USER_ID as any, start, end);

    expect(
      mockParticipantRepository.findByUserAndClinicIds,
    ).toHaveBeenCalledWith(USER_ID, start, end, undefined);
    expect(result).toHaveLength(0);
  });
});
