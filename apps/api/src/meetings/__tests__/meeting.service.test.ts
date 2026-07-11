import { describe, it, expect, vi, beforeEach } from "vitest";
import { ForbiddenError, NotFoundError } from "@api/errors";

const mockMeetingRepository = vi.hoisted(() => ({
  findById: vi.fn(),
}));
const mockAnimalMeetingService = vi.hoisted(() => ({
  getAnimalMeetingsAsVet: vi.fn(),
  getAllByVet: vi.fn(),
}));
const mockInternalMeetingService = vi.hoisted(() => ({
  getFlatsByUser: vi.fn(),
  getAllByUser: vi.fn(),
}));
const mockAvailabilityService = vi.hoisted(() => ({
  getAvailabilities: vi.fn(),
  sliceAvailabilityIntoSlots: vi.fn(),
}));
const mockClinicService = vi.hoisted(() => ({
  getClinicIdsByUserId: vi.fn(),
}));
const mockVeterinarianProfileRepository = vi.hoisted(() => ({
  findById: vi.fn(),
}));

vi.mock("@api/meetings/meeting.repository", () => ({
  MeetingRepository: vi.fn(function () {
    return mockMeetingRepository;
  }),
}));
vi.mock("@api/meetings/animal-meeting", () => ({
  AnimalMeetingService: vi.fn(function () {
    return mockAnimalMeetingService;
  }),
}));
vi.mock("@api/meetings/internal-meeting", () => ({
  InternalMeetingService: vi.fn(function () {
    return mockInternalMeetingService;
  }),
}));
vi.mock("@api/meetings/availabilities", () => ({
  AvailabilityService: vi.fn(function () {
    return mockAvailabilityService;
  }),
}));
vi.mock("@api/clinics/clinic.service", () => ({
  ClinicService: vi.fn(function () {
    return mockClinicService;
  }),
}));
vi.mock("@api/veterinarians/veterinarian-profile.repository", () => ({
  VeterinarianProfileRepository: vi.fn(function () {
    return mockVeterinarianProfileRepository;
  }),
}));

const { MeetingRepository } = await import("@api/meetings/meeting.repository");
const { AnimalMeetingService } = await import("@api/meetings/animal-meeting");
const { InternalMeetingService } =
  await import("@api/meetings/internal-meeting");
const { AvailabilityService } = await import("@api/meetings/availabilities");
const { ClinicService } = await import("@api/clinics/clinic.service");
const { VeterinarianProfileRepository } =
  await import("@api/veterinarians/veterinarian-profile.repository");
const { MeetingService } = await import("@api/meetings/meeting.service");

const meetingService = new MeetingService(
  new MeetingRepository({} as any),
  new AnimalMeetingService({} as any, {} as any, {} as any),
  new InternalMeetingService({} as any, {} as any, {} as any, {} as any),
  new AvailabilityService(
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
  ),
  new ClinicService({} as any),
  new VeterinarianProfileRepository({} as any),
);

beforeEach(() => vi.clearAllMocks());

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
  parentId: null,
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
  veterinarianClinicId: "veto-clinic-1",
  ...overrides,
});

const makeInternalSpecific = (overrides = {}) => ({
  id: "internal-1",
  title: "Réunion équipe",
  description: null,
  recurringId: null,
  meetingId: "base-1",
  participants: [],
  ...overrides,
});

const makeAvailabilitySpecific = (overrides = {}) => ({
  id: "avail-1",
  userId: "veto-1",
  clinicId: "clinic-1",
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

// ── flattenMeetingByBase ──────────────────────────────────────────────────────

describe("MeetingService.flattenMeetingByBase", () => {
  it("aplatit un meeting de type ANIMAL", () => {
    const result = meetingService.flattenMeetingByBase(makeBaseWithAnimal());
    expect(result).toHaveProperty("animalId", "pet-1");
  });

  it("aplatit un meeting de type INTERNAL", () => {
    const base = makeBase({
      kind: "INTERNAL" as const,
      internalMeeting: makeInternalSpecific(),
    });
    const result = meetingService.flattenMeetingByBase(base);
    expect(result).toHaveProperty("title", "Réunion équipe");
  });

  it("aplatit un meeting de type AVAILABILITY", () => {
    const base = makeBase({
      kind: "AVAILABILITY" as const,
      availabilty: makeAvailabilitySpecific(),
    });
    const result = meetingService.flattenMeetingByBase(base);
    expect(result).toHaveProperty("userId", "veto-1");
  });

  it("throw si aucun sous-type n'est présent", () => {
    expect(() => meetingService.flattenMeetingByBase(makeBase())).toThrow();
  });
});

// ── getCalendar ───────────────────────────────────────────────────────────────

describe("MeetingService.getCalendar", () => {
  it("ForbiddenError si role !== SECRETARY et targetId !== userId (consultation du calendrier d'autrui)", async () => {
    await expect(
      meetingService.getCalendar({
        userId: "user-1" as any,
        role: "VETERINARIAN" as any,
        targetId: "vet-2" as any, // différent de userId
        targetRole: "VETERINARIAN" as any,
        start,
        end,
      }),
    ).rejects.toThrow(ForbiddenError);

    expect(mockClinicService.getClinicIdsByUserId).not.toHaveBeenCalled();
  });

  it("autorisé si targetId === userId, même sans être SECRETARY", async () => {
    mockClinicService.getClinicIdsByUserId.mockResolvedValue(["clinic-1"]);
    mockAnimalMeetingService.getAnimalMeetingsAsVet.mockResolvedValue([]);
    mockInternalMeetingService.getFlatsByUser.mockResolvedValue([]);
    mockAvailabilityService.getAvailabilities.mockResolvedValue([]);

    const result = await meetingService.getCalendar({
      userId: "vet-1" as any,
      role: "VETERINARIAN" as any,
      targetId: "vet-1" as any, // égal à userId
      targetRole: "VETERINARIAN" as any,
      start,
      end,
    });

    expect(result.meetings).toHaveLength(0);
  });

  it("SECRETARY peut consulter le calendrier d'un autre utilisateur", async () => {
    mockClinicService.getClinicIdsByUserId.mockResolvedValue(["clinic-1"]);
    mockAnimalMeetingService.getAnimalMeetingsAsVet.mockResolvedValue([
      meetingService.flattenMeetingByBase(makeBaseWithAnimal()),
    ]);
    mockInternalMeetingService.getFlatsByUser.mockResolvedValue([]);
    mockAvailabilityService.getAvailabilities.mockResolvedValue([]);

    const result = await meetingService.getCalendar({
      userId: "secretary-1" as any,
      role: "SECRETARY" as any,
      targetId: "vet-1" as any,
      targetRole: "VETERINARIAN" as any,
      start,
      end,
    });

    expect(result.meetings).toHaveLength(1);
  });

  it("NotFoundError si la cible n'a aucune clinique associée", async () => {
    mockClinicService.getClinicIdsByUserId.mockResolvedValueOnce([]); // résolution de la cible

    await expect(
      meetingService.getCalendar({
        userId: "secretary-1" as any,
        role: "SECRETARY" as any,
        targetId: "vet-1" as any,
        targetRole: "VETERINARIAN" as any,
        start,
        end,
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("targetRole VETERINARIAN — récupère les animalMeetings avec les clinicIds de l'auteur", async () => {
    mockClinicService.getClinicIdsByUserId
      .mockResolvedValueOnce(["target-clinic"]) // résolution de la cible (targetId/targetRole)
      .mockResolvedValueOnce(["clinic-1"]); // clinicIds de l'auteur (userId/role)
    mockAnimalMeetingService.getAnimalMeetingsAsVet.mockResolvedValue([
      meetingService.flattenMeetingByBase(makeBaseWithAnimal()),
    ]);
    mockInternalMeetingService.getFlatsByUser.mockResolvedValue([]);
    mockAvailabilityService.getAvailabilities.mockResolvedValue([]);

    const result = await meetingService.getCalendar({
      userId: "secretary-1" as any,
      role: "SECRETARY" as any,
      targetId: "vet-1" as any,
      targetRole: "VETERINARIAN" as any,
      start,
      end,
    });

    expect(
      mockAnimalMeetingService.getAnimalMeetingsAsVet,
    ).toHaveBeenCalledWith("vet-1", start, end, ["clinic-1"]);
    expect(result.meetings).toHaveLength(1);
  });

  it("targetRole différent de VETERINARIAN — pas d'appel animalMeetings", async () => {
    mockClinicService.getClinicIdsByUserId
      .mockResolvedValueOnce(["target-clinic"])
      .mockResolvedValueOnce(["clinic-1"]);
    mockInternalMeetingService.getFlatsByUser.mockResolvedValue([]);
    mockAvailabilityService.getAvailabilities.mockResolvedValue([]);

    const result = await meetingService.getCalendar({
      userId: "secretary-1" as any,
      role: "SECRETARY" as any,
      targetId: "client-1" as any,
      targetRole: "CLIENT" as any,
      start,
      end,
    });

    expect(
      mockAnimalMeetingService.getAnimalMeetingsAsVet,
    ).not.toHaveBeenCalled();
    expect(result.meetings).toHaveLength(0);
  });

  it("combine internal + animal dans meetings, availabilities retourné séparément", async () => {
    mockClinicService.getClinicIdsByUserId
      .mockResolvedValueOnce(["target-clinic"])
      .mockResolvedValueOnce(["clinic-1"]);
    mockAnimalMeetingService.getAnimalMeetingsAsVet.mockResolvedValue([
      meetingService.flattenMeetingByBase(makeBaseWithAnimal()),
    ]);
    mockInternalMeetingService.getFlatsByUser.mockResolvedValue([
      meetingService.flattenMeetingByBase(
        makeBase({
          kind: "INTERNAL" as const,
          internalMeeting: makeInternalSpecific(),
        }),
      ),
    ]);
    mockAvailabilityService.getAvailabilities.mockResolvedValue([
      meetingService.flattenMeetingByBase(
        makeBase({
          kind: "AVAILABILITY" as const,
          availabilty: makeAvailabilitySpecific(),
        }),
      ),
    ]);

    const result = await meetingService.getCalendar({
      userId: "secretary-1" as any,
      role: "SECRETARY" as any,
      targetId: "vet-1" as any,
      targetRole: "VETERINARIAN" as any,
      start,
      end,
    });

    expect(result.meetings).toHaveLength(2);
    expect(result.availabilities).toHaveLength(1);
  });
});

// ── getMeetingById ────────────────────────────────────────────────────────────

describe("MeetingService.getMeetingById", () => {
  it("meeting introuvable — NotFoundError", async () => {
    mockMeetingRepository.findById.mockResolvedValue(null);
    await expect(
      meetingService.getMeetingById("unknown" as any),
    ).rejects.toThrow(NotFoundError);
  });

  it("retourne le meeting aplati", async () => {
    mockMeetingRepository.findById.mockResolvedValue(makeBaseWithAnimal());
    const result = await meetingService.getMeetingById("base-1" as any);
    expect(result).toHaveProperty("animalId", "pet-1");
  });
});

// ── getVetSlots ───────────────────────────────────────────────────────────────

describe("MeetingService.getVetSlots", () => {
  it("NotFoundError si le vétérinaire n'existe pas", async () => {
    mockVeterinarianProfileRepository.findById.mockResolvedValue(null);

    await expect(
      meetingService.getVetSlots({
        veterinarianId: "vet-1" as any,
        start,
        end,
        clinicIds: ["clinic-1" as any],
      }),
    ).rejects.toThrow(NotFoundError);

    expect(mockAvailabilityService.getAvailabilities).not.toHaveBeenCalled();
  });

  it("passe les créneaux occupés (internal + animal) à sliceAvailabilityIntoSlots", async () => {
    mockVeterinarianProfileRepository.findById.mockResolvedValue({
      id: "vet-1",
    });

    const availability = meetingService.flattenMeetingByBase(
      makeBase({
        kind: "AVAILABILITY" as const,
        availabilty: makeAvailabilitySpecific(),
      }),
    );
    const internalOccupied = meetingService.flattenMeetingByBase(
      makeBase({
        kind: "INTERNAL" as const,
        internalMeeting: makeInternalSpecific(),
        startTime: new Date("1970-01-01T09:00:00.000Z"),
        endTime: new Date("1970-01-01T09:30:00.000Z"),
      }),
    );
    const animalOccupied =
      meetingService.flattenMeetingByBase(makeBaseWithAnimal());

    mockAvailabilityService.getAvailabilities.mockResolvedValue([availability]);
    mockInternalMeetingService.getFlatsByUser.mockResolvedValue([
      internalOccupied,
    ]);
    mockAnimalMeetingService.getAnimalMeetingsAsVet.mockResolvedValue([
      animalOccupied,
    ]);
    mockAvailabilityService.sliceAvailabilityIntoSlots.mockReturnValue([
      { startTime: new Date(), endTime: new Date() },
    ]);

    const slots = await meetingService.getVetSlots({
      veterinarianId: "vet-1" as any,
      start,
      end,
      clinicIds: ["clinic-1" as any],
    });

    expect(
      mockAvailabilityService.sliceAvailabilityIntoSlots,
    ).toHaveBeenCalledWith(
      availability,
      [
        {
          start: internalOccupied.startTime,
          end: internalOccupied.endTime,
          date: internalOccupied.date,
        },
        {
          start: animalOccupied.startTime,
          end: animalOccupied.endTime,
          date: animalOccupied.date,
        },
      ],
      30,
    );
    expect(slots).toHaveLength(1);
  });

  it("utilise slotDurationMinutes personnalisé", async () => {
    mockVeterinarianProfileRepository.findById.mockResolvedValue({
      id: "vet-1",
    });
    mockAvailabilityService.getAvailabilities.mockResolvedValue([
      meetingService.flattenMeetingByBase(
        makeBase({
          kind: "AVAILABILITY" as const,
          availabilty: makeAvailabilitySpecific(),
        }),
      ),
    ]);
    mockInternalMeetingService.getFlatsByUser.mockResolvedValue([]);
    mockAnimalMeetingService.getAnimalMeetingsAsVet.mockResolvedValue([]);
    mockAvailabilityService.sliceAvailabilityIntoSlots.mockReturnValue([]);

    await meetingService.getVetSlots({
      veterinarianId: "vet-1" as any,
      start,
      end,
      slotDurationMinutes: 15,
      clinicIds: ["clinic-1" as any],
    });

    expect(
      mockAvailabilityService.sliceAvailabilityIntoSlots,
    ).toHaveBeenCalledWith(expect.anything(), expect.anything(), 15);
  });

  it("aucune disponibilité — tableau vide, slicer jamais appelé", async () => {
    mockVeterinarianProfileRepository.findById.mockResolvedValue({
      id: "vet-1",
    });
    mockAvailabilityService.getAvailabilities.mockResolvedValue([]);
    mockInternalMeetingService.getFlatsByUser.mockResolvedValue([]);
    mockAnimalMeetingService.getAnimalMeetingsAsVet.mockResolvedValue([]);

    const slots = await meetingService.getVetSlots({
      veterinarianId: "vet-1" as any,
      start,
      end,
      clinicIds: ["clinic-1" as any],
    });

    expect(
      mockAvailabilityService.sliceAvailabilityIntoSlots,
    ).not.toHaveBeenCalled();
    expect(slots).toHaveLength(0);
  });
});

// ── generateIcs ───────────────────────────────────────────────────────────────

describe("MeetingService.generateIcs", () => {
  it("génère un event pour chaque animalMeeting ponctuel du véto", async () => {
    mockAnimalMeetingService.getAllByVet.mockResolvedValue([
      {
        meeting: {
          id: "meeting-1",
          date: new Date("2026-06-10T00:00:00.000Z"),
          startTime: new Date("1970-01-01T09:00:00.000Z"),
          endTime: new Date("1970-01-01T09:30:00.000Z"),
        },
        speciality: { name: "Cardiologie" },
        animal: { name: "Rex" },
        description: "Consultation de routine",
      },
    ]);
    mockInternalMeetingService.getAllByUser.mockResolvedValue([]);

    const ics = await meetingService.generateIcs(
      "vet-1" as any,
      "VETERINARIAN" as any,
    );

    expect(ics).toContain("SUMMARY:Cardiologie");
    expect(ics).toContain("DURATION:PT30M");
  });

  it("ignore les animalMeetings sans meeting rattaché", async () => {
    mockAnimalMeetingService.getAllByVet.mockResolvedValue([
      {
        meeting: null,
        speciality: null,
        animal: { name: "Rex" },
        description: null,
      },
    ]);
    mockInternalMeetingService.getAllByUser.mockResolvedValue([]);

    const ics = await meetingService.generateIcs(
      "vet-1" as any,
      "VETERINARIAN" as any,
    );

    expect(ics).not.toContain("BEGIN:VEVENT");
  });

  it("titre par défaut 'Consultation générale' si pas de spécialité", async () => {
    mockAnimalMeetingService.getAllByVet.mockResolvedValue([
      {
        meeting: {
          id: "meeting-1",
          date: new Date("2026-06-10T00:00:00.000Z"),
          startTime: new Date("1970-01-01T09:00:00.000Z"),
          endTime: new Date("1970-01-01T09:30:00.000Z"),
        },
        speciality: null,
        animal: { name: "Rex" },
        description: null,
      },
    ]);
    mockInternalMeetingService.getAllByUser.mockResolvedValue([]);

    const ics = await meetingService.generateIcs(
      "vet-1" as any,
      "VETERINARIAN" as any,
    );

    expect(ics).toContain("SUMMARY:Consultation générale");
  });

  it("ajoute un event standalone pour un internalMeeting SPECIFIED non récurrent", async () => {
    mockAnimalMeetingService.getAllByVet.mockResolvedValue([]);
    mockInternalMeetingService.getAllByUser.mockResolvedValue([
      {
        id: "internal-1",
        title: "Formation équipement",
        description: "Présentation échographie",
        recurringId: null,
        meetingId: "meeting-2",
        meeting: {
          type: "SPECIFIED",
          date: new Date("2026-03-20T00:00:00.000Z"),
          startTime: new Date("1970-01-01T14:00:00.000Z"),
          endTime: new Date("1970-01-01T15:30:00.000Z"),
        },
      },
    ]);

    const ics = await meetingService.generateIcs(
      "vet-1" as any,
      "VETERINARIAN" as any,
    );

    expect(ics).toContain("SUMMARY:Formation équipement");
    expect(ics).toContain("DURATION:PT90M");
  });

  it("génère un event récurrent (RRULE) pour un internalMeeting récurrent", async () => {
    mockAnimalMeetingService.getAllByVet.mockResolvedValue([]);
    mockInternalMeetingService.getAllByUser.mockResolvedValue([
      {
        id: "internal-recurring-1",
        title: "Réunion hebdomadaire équipe",
        description: "Point de la semaine",
        recurringId: "recurring-1",
        meetingId: null,
        meeting: null,
        recurring: {
          id: "recurring-1",
          frequency: "WEEKLY",
          dayOfWeek: [1],
          dateStart: new Date("2026-01-05T00:00:00.000Z"),
          dateEnd: new Date("2026-09-30T00:00:00.000Z"),
          startTime: new Date("1970-01-01T10:00:00.000Z"),
          endTime: new Date("1970-01-01T11:00:00.000Z"),
        },
      },
    ]);

    const ics = await meetingService.generateIcs(
      "vet-1" as any,
      "VETERINARIAN" as any,
    );

    expect(ics).toContain("SUMMARY:Réunion hebdomadaire équipe");
    expect(ics).toContain("RRULE:FREQ=WEEKLY");
    expect(ics).toContain("DURATION:PT60M");
  });

  it("ajoute les EXDATE pour les occurrences EXCEPTION d'une récurrence", async () => {
    mockAnimalMeetingService.getAllByVet.mockResolvedValue([]);
    mockInternalMeetingService.getAllByUser.mockResolvedValue([
      {
        id: "internal-recurring-1",
        title: "Réunion hebdomadaire équipe",
        description: null,
        recurringId: "recurring-1",
        meetingId: null,
        meeting: null,
        recurring: {
          id: "recurring-1",
          frequency: "WEEKLY",
          dayOfWeek: [1],
          dateStart: new Date("2026-01-05T00:00:00.000Z"),
          dateEnd: new Date("2026-09-30T00:00:00.000Z"),
          startTime: new Date("1970-01-01T10:00:00.000Z"),
          endTime: new Date("1970-01-01T11:00:00.000Z"),
        },
      },
      {
        id: "internal-exception-1",
        title: "Réunion hebdomadaire équipe",
        description: null,
        recurringId: "recurring-1",
        meetingId: "meeting-exception-1",
        meeting: {
          type: "EXCEPTION",
          parentId: "recurring-1",
          date: new Date("2026-03-16T00:00:00.000Z"),
          startTime: new Date("1970-01-01T10:00:00.000Z"),
          endTime: new Date("1970-01-01T11:00:00.000Z"),
        },
      },
    ]);

    const ics = await meetingService.generateIcs(
      "vet-1" as any,
      "VETERINARIAN" as any,
    );

    expect(ics).toContain("EXDATE");
  });
});
