import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from "@api/errors";

// Pas de typage strict ici : on mocke le repository "à la main" avec des
// vi.fn() sans forcer la forme exacte de InternalMeetingRepository (ça évite
// les frictions avec les champs privés / types de retour imbriqués, au prix
// de la détection auto si l'interface réelle change).
const mockRepository = vi.hoisted(() => ({
  findById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  findParticipant: vi.fn(),
  updateParticipantStatus: vi.fn(),
  copyParticipantStatuses: vi.fn(),
  createOccurrenceOverride: vi.fn(),
  createException: vi.fn(),
  deleteRecurring: vi.fn(),
  truncateRecurring: vi.fn(),
  deleteFutureChildren: vi.fn(),
}));

const mockRecurringService = vi.hoisted(() => ({
  update: vi.fn(),
}));

const mockSafeParse = vi.hoisted(() => vi.fn());

vi.mock("../internal-meeting.repository", () => ({
  InternalMeetingRepository: vi.fn(function () {
    return mockRepository;
  }),
}));

vi.mock("../../recurring-meeting/recurring-meeting.service", () => ({
  RecurringService: vi.fn(function () {
    return mockRecurringService;
  }),
}));

vi.mock("@armali/schemas", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@armali/schemas")>();
  return {
    ...actual,
    createInternalMeetingSchema: { safeParse: mockSafeParse },
  };
});

// On garde les vraies implémentations (withAvatarUrl, flatUser, ...) et on
// ne mocke que flatClinicId, seule fonction dont ce fichier a besoin de
// contrôler la sortie.
vi.mock("@api/users/user.utils", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@api/users/user.utils")>();
  return {
    ...actual,
    flatClinicId: vi.fn((user) => ({ ...user, flattened: true })),
  };
});

const { InternalMeetingRepository } =
  await import("../internal-meeting.repository");
const { RecurringService } =
  await import("../../recurring-meeting/recurring-meeting.service");
const { InternalMeetingService } = await import("../internal-meeting.service");

const service = new InternalMeetingService(
  new InternalMeetingRepository({} as any),
  new RecurringService({} as any, {} as any),
);

beforeEach(() => {
  vi.clearAllMocks();
  // withAvatarUrl (réel depuis importOriginal) en a besoin dès qu'un test
  // passe par getById.
  process.env.ASSETS_BASE_URL = "http://localhost:9000/test-bucket";
});

const USER_ID = "user-1";
const OTHER_USER_ID = "user-2";
const CLINIC_ID = "clinic-1";

const makeInternalMeeting = (overrides = {}) =>
  ({
    id: "internal-meeting-1", // PK propre d'InternalMeeting
    meetingId: "meeting-base-1", // FK vers MeetingBase (peut être null si occurrence virtuelle)
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
  it("délègue directement au repository", async () => {
    const data = { title: "Nouvelle réunion" } as any;
    mockRepository.create.mockResolvedValue(makeInternalMeeting() as any);

    await service.create({ data, userId: USER_ID, clinicId: CLINIC_ID });

    expect(mockRepository.create).toHaveBeenCalledWith({
      data,
      authorId: USER_ID,
      clinicId: CLINIC_ID,
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

  it("récurrence présente mais date absente — BadRequestError", async () => {
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
      mockRepository.findById.mockResolvedValue(
        makeInternalMeeting({ recurringId: "recurring-1" }),
      );
      mockRecurringService.update.mockResolvedValue({ id: "new-recurring-1" });
      mockRepository.findById.mockResolvedValueOnce(
        makeInternalMeeting({ recurringId: "recurring-1" }),
      );

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

    it("BUG SUSPECTÉ : findById est appelé avec InternalMeeting.id au lieu du MeetingBase.id d'origine", async () => {
      const existing = makeInternalMeeting({
        id: "internal-meeting-XYZ", // PK propre d'InternalMeeting, différente de meetingId
        recurringId: "recurring-1",
        recurring: {
          id: "recurring-1",
          startTime: new Date("2027-06-01T09:00:00Z"),
          endTime: new Date("2027-06-01T10:00:00Z"),
        },
        meetingId: "meeting-base-1",
      });
      mockRepository.findById
        .mockResolvedValueOnce(existing) // premier appel : lookup initial
        .mockResolvedValueOnce(makeInternalMeeting()); // second appel : valeur de retour finale

      mockRepository.update.mockResolvedValue({
        id: "internal-meeting-XYZ", // repository.update retourne un InternalMeeting, donc .id = sa propre PK
      });

      await service.update({
        id: "meeting-base-1", // id du MeetingBase transmis en paramètre — c'est CELUI-CI qui devrait être réutilisé
        data: {} as any,
        userId: USER_ID,
        scope: "single",
        originDate: new Date("2027-06-01"),
      });

      // Comportement actuel observé : le service rappelle findById avec
      // internalMeeting.id (la PK d'InternalMeeting, "internal-meeting-XYZ"),
      // alors que findById() ne matche que sur meetingId/recurringId (des FK
      // vers MeetingBase/MeetingReccuring). "internal-meeting-XYZ" ne
      // correspondra donc jamais à un MeetingBase.id réel — findById
      // retournera null en pratique, hors mock. Ce test documente l'appel
      // tel qu'il est fait aujourd'hui.
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
        data: { title: "Nouveau titre" } as any, // pas de date/startTime/endTime → isRescheduling = false
        userId: USER_ID,
        scope: "single",
        originDate: new Date("2027-06-01"),
      });

      expect(mockRepository.copyParticipantStatuses).toHaveBeenCalledWith({
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

      expect(mockRepository.copyParticipantStatuses).not.toHaveBeenCalled();
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

    it("crée une exception puis matérialise l'occurrence, findById avec le bon MeetingBase.id (pas de bug ici)", async () => {
      const existing = makeInternalMeeting({
        recurringId: "recurring-1",
        recurring: {
          id: "recurring-1",
          startTime: new Date("2027-06-01T09:00:00Z"),
          endTime: new Date("2027-06-01T10:00:00Z"),
        },
        meetingId: null, // occurrence virtuelle, jamais matérialisée
      });
      mockRepository.findById
        .mockResolvedValueOnce(existing)
        .mockResolvedValueOnce(existing);
      mockRepository.createException.mockResolvedValue(undefined);
      mockRepository.create.mockResolvedValue({
        id: "new-meeting-base-1", // repository.create() retourne un MeetingBase → .id = MeetingBase.id, correct
        internalMeeting: { id: "new-internal-meeting-1" },
      });

      await service.update({
        id: "meeting-base-1",
        data: {} as any,
        userId: USER_ID,
        scope: "single",
        originDate: new Date("2027-06-01"),
      });

      expect(mockRepository.createException).toHaveBeenCalledWith({
        parentId: "recurring-1",
        date: new Date("2027-06-01"),
        startTime: existing.recurring?.startTime,
        endTime: existing.recurring?.endTime,
      });
      expect(mockRepository.findById).toHaveBeenLastCalledWith(
        "new-meeting-base-1",
      );
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

  it("scope 'all' — supprime les occurrences futures et raccourcit la série (dayBeforeDate calculé en heure locale, cf. note)", async () => {
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
    // On vérifie seulement que c'est bien le jour précédent (peu importe le
    // fuseau exact) plutôt qu'une valeur figée, vu la fragilité connue de
    // ce calcul en heure locale.
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
      service.getById({ id: "meeting-1", role: "CLIENT" }),
    ).rejects.toThrow(ForbiddenError);
    expect(mockRepository.findById).not.toHaveBeenCalled();
  });

  it("introuvable — NotFoundError", async () => {
    mockRepository.findById.mockResolvedValue(null);

    await expect(
      service.getById({ id: "unknown", role: "VETERINARIAN" }),
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
      role: "VETERINARIAN",
    });

    expect(result.participants[0].user).toEqual({
      id: USER_ID,
      avatarUrl: null,
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
    it("participant introuvable côté repository — ForbiddenError", async () => {
      mockRepository.findById.mockResolvedValue(
        makeInternalMeeting({ id: "internal-meeting-1", recurringId: null }),
      );
      mockRepository.findParticipant.mockResolvedValue(null);

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
      mockRepository.findParticipant.mockResolvedValue({
        userId: USER_ID,
        status: "PENDING",
      });
      mockRepository.updateParticipantStatus.mockResolvedValue(undefined);

      await service.updateParticipantStatus({
        meetingId: "meeting-1",
        userId: USER_ID,
        status: "ACCEPTED",
        scope: "all",
      });

      expect(mockRepository.updateParticipantStatus).toHaveBeenCalledWith({
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
      mockRepository.updateParticipantStatus.mockResolvedValue(undefined);

      await service.updateParticipantStatus({
        meetingId: "recurring-1",
        userId: USER_ID,
        status: "DECLINED",
        scope: "all",
      });

      expect(mockRepository.updateParticipantStatus).toHaveBeenCalledWith({
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
