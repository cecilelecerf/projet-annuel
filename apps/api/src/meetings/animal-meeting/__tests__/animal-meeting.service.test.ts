import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from "@api/errors";

const mockRepository = vi.hoisted(() => ({
  findById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  findByClient: vi.fn(),
  findByAnimal: vi.fn(),
  findByClientAndClinic: vi.fn(),
  findByVeterinarian: vi.fn(),
  findByVeterinarianAndClinic: vi.fn(),
  findByClinic: vi.fn(),
}));

const mockUserRepository = vi.hoisted(() => ({
  getUserById: vi.fn(),
}));

const mockEmailService = vi.hoisted(() => ({
  sendAppointmentEmail: vi.fn(),
}));

const mockPrisma = vi.hoisted(() => ({
  veterinarianClinic: { findFirst: vi.fn() },
  animal: { findUnique: vi.fn() },
  meetingBase: { findFirst: vi.fn() },
  meetingReccuring: { findFirst: vi.fn() },
}));

vi.mock("../animal-meeting.repository", () => ({
  AnimalMeetingRepository: vi.fn(function () {
    return mockRepository;
  }),
}));
vi.mock("@api/users/user.repository", () => ({
  UserRepository: vi.fn(function () {
    return mockUserRepository;
  }),
}));
vi.mock("@api/emails/email.service", () => ({
  EmailService: vi.fn(function () {
    return mockEmailService;
  }),
}));
vi.mock("@api/lib/prisma", () => ({ prisma: mockPrisma }));

const { AnimalMeetingRepository } =
  await import("../animal-meeting.repository");
const { UserRepository } = await import("@api/users/user.repository");
const { EmailService } = await import("@api/emails/email.service");
const { AnimalMeetingService } = await import("../animal-meeting.service");

const service = new AnimalMeetingService(
  new AnimalMeetingRepository({} as any),
  new UserRepository({} as any),
  new EmailService(),
);

beforeEach(() => vi.clearAllMocks());

const CLIENT_ID = "client-1";
const VET_PROFILE_ID = "vet-profile-1";
const CLINIC_ID = "clinic-1";

// Toutes les dates de "futur" sont volontairement loin dans le temps pour
// ne pas dépendre de la date d'exécution des tests (assertIsFuture / 48h).
const FAR_FUTURE_DATE = new Date("2099-06-10T00:00:00.000Z");
const FAR_FUTURE_START = new Date("1970-01-01T09:00:00.000Z");
const FAR_FUTURE_END = new Date("1970-01-01T09:30:00.000Z");

const makeAnimal = (overrides = {}) => ({
  id: "animal-1",
  name: "Rex",
  clientId: CLIENT_ID,
  client: {
    id: CLIENT_ID,
    user: { email: "client@gmail.com", firstname: "Jean", avatar: null },
  },
  ...overrides,
});

const makeMeetingWithAnimal = (overrides = {}) => ({
  id: "meeting-1",
  description: null,
  meeting: {
    id: "base-1",
    date: FAR_FUTURE_DATE,
    startTime: FAR_FUTURE_START,
    endTime: FAR_FUTURE_END,
  },
  animal: {
    id: "animal-1",
    name: "Rex",
    clientId: CLIENT_ID,
    client: {
      id: CLIENT_ID,
      user: { email: "client@gmail.com", firstname: "Jean", avatar: null },
    },
    dateOfBirth: new Date("2020-01-01"),
  },
  veterinarianClinic: {
    veterinarianId: VET_PROFILE_ID,
    veterinarian: {
      id: VET_PROFILE_ID,
      user: { firstname: "Paul", email: "veto@gmail.com", avatar: null },
    },
  },
  ...overrides,
});

// ── create ───────────────────────────────────────────────────────────────────

describe("AnimalMeetingService.create", () => {
  it("BadRequestError si la date/heure est dans le passé", async () => {
    await expect(
      service.create({
        data: {
          date: new Date("2020-01-01"),
          startTime: new Date("1970-01-01T09:00:00.000Z"),
          endTime: new Date("1970-01-01T09:30:00.000Z"),
          clinicId: CLINIC_ID,
          veterinarianId: VET_PROFILE_ID,
          animalId: "animal-1",
        } as any,
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it("NotFoundError si aucun veterinarianClinic ne matche", async () => {
    mockPrisma.veterinarianClinic.findFirst.mockResolvedValue(null);

    await expect(
      service.create({
        data: {
          date: FAR_FUTURE_DATE,
          startTime: FAR_FUTURE_START,
          endTime: FAR_FUTURE_END,
          clinicId: CLINIC_ID,
          veterinarianId: VET_PROFILE_ID,
          animalId: "animal-1",
        } as any,
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("ForbiddenError si l'animal n'existe pas", async () => {
    mockPrisma.veterinarianClinic.findFirst.mockResolvedValue({ id: "vc-1" });
    mockPrisma.animal.findUnique.mockResolvedValue(null);

    await expect(
      service.create({
        data: {
          date: FAR_FUTURE_DATE,
          startTime: FAR_FUTURE_START,
          endTime: FAR_FUTURE_END,
          clinicId: CLINIC_ID,
          veterinarianId: VET_PROFILE_ID,
          animalId: "animal-1",
        } as any,
      }),
    ).rejects.toThrow(ForbiddenError);
  });

  it("ConflictError si le véto a déjà un RDV sur ce créneau", async () => {
    mockPrisma.veterinarianClinic.findFirst.mockResolvedValue({ id: "vc-1" });
    mockPrisma.animal.findUnique.mockResolvedValue(makeAnimal());
    mockPrisma.meetingBase.findFirst.mockResolvedValue({
      id: "conflicting-meeting",
    });

    await expect(
      service.create({
        data: {
          date: FAR_FUTURE_DATE,
          startTime: FAR_FUTURE_START,
          endTime: FAR_FUTURE_END,
          clinicId: CLINIC_ID,
          veterinarianId: VET_PROFILE_ID,
          animalId: "animal-1",
        } as any,
      }),
    ).rejects.toThrow(ConflictError);
  });

  it("ConflictError si le véto n'a aucune disponibilité (ponctuelle ni récurrente)", async () => {
    mockPrisma.veterinarianClinic.findFirst.mockResolvedValue({ id: "vc-1" });
    mockPrisma.animal.findUnique.mockResolvedValue(makeAnimal());
    mockPrisma.meetingBase.findFirst
      .mockResolvedValueOnce(null) // pas de conflit RDV
      .mockResolvedValueOnce(null); // pas de dispo ponctuelle
    mockPrisma.meetingReccuring.findFirst.mockResolvedValue(null);

    await expect(
      service.create({
        data: {
          date: FAR_FUTURE_DATE,
          startTime: FAR_FUTURE_START,
          endTime: FAR_FUTURE_END,
          clinicId: CLINIC_ID,
          veterinarianId: VET_PROFILE_ID,
          animalId: "animal-1",
        } as any,
      }),
    ).rejects.toThrow(ConflictError);
  });

  it("crée le meeting et envoie l'email de confirmation si tout est valide", async () => {
    mockPrisma.veterinarianClinic.findFirst.mockResolvedValue({ id: "vc-1" });
    mockPrisma.animal.findUnique.mockResolvedValue(makeAnimal());
    mockPrisma.meetingBase.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: "avail-1" }); // dispo ponctuelle trouvée
    mockRepository.create.mockResolvedValue({ id: "meeting-1" });

    const result = await service.create({
      data: {
        date: FAR_FUTURE_DATE,
        startTime: FAR_FUTURE_START,
        endTime: FAR_FUTURE_END,
        clinicId: CLINIC_ID,
        veterinarianId: VET_PROFILE_ID,
        animalId: "animal-1",
      } as any,
    });

    expect(mockRepository.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ animalId: "animal-1" }),
      veterinarianClinicId: "vc-1",
    });
    expect(mockEmailService.sendAppointmentEmail).toHaveBeenCalledWith(
      "created",
      "client@gmail.com",
      expect.objectContaining({ animalName: "Rex" }),
    );
    expect(result).toEqual({ id: "meeting-1" });
  });

  it("ConflictError si repository.create ne retourne rien", async () => {
    mockPrisma.veterinarianClinic.findFirst.mockResolvedValue({ id: "vc-1" });
    mockPrisma.animal.findUnique.mockResolvedValue(makeAnimal());
    mockPrisma.meetingBase.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: "avail-1" });
    mockRepository.create.mockResolvedValue(null);

    await expect(
      service.create({
        data: {
          date: FAR_FUTURE_DATE,
          startTime: FAR_FUTURE_START,
          endTime: FAR_FUTURE_END,
          clinicId: CLINIC_ID,
          veterinarianId: VET_PROFILE_ID,
          animalId: "animal-1",
        } as any,
      }),
    ).rejects.toThrow(ConflictError);
  });
});

// ── getById ──────────────────────────────────────────────────────────────────

describe("AnimalMeetingService.getById", () => {
  it("introuvable — NotFoundError", async () => {
    mockRepository.findById.mockResolvedValue(null);
    await expect(
      service.getById({
        id: "unknown",
        userId: CLIENT_ID,
        role: "CLIENT" as any,
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("client non-propriétaire — ForbiddenError", async () => {
    mockRepository.findById.mockResolvedValue(makeMeetingWithAnimal());

    await expect(
      service.getById({
        id: "meeting-1",
        userId: "other-client",
        role: "CLIENT" as any,
      }),
    ).rejects.toThrow(ForbiddenError);
  });

  it("staff (VETERINARIAN) — accès autorisé même sans être propriétaire", async () => {
    mockRepository.findById.mockResolvedValue(makeMeetingWithAnimal());

    const result = await service.getById({
      id: "meeting-1",
      userId: "some-vet",
      role: "VETERINARIAN" as any,
    });

    expect(result.animal.name).toBe("Rex");
  });

  it("client propriétaire — accès autorisé", async () => {
    mockRepository.findById.mockResolvedValue(makeMeetingWithAnimal());

    const result = await service.getById({
      id: "meeting-1",
      userId: CLIENT_ID,
      role: "CLIENT" as any,
    });

    expect(result.animal.name).toBe("Rex");
  });
});

// ── update ───────────────────────────────────────────────────────────────────

describe("AnimalMeetingService.update", () => {
  it("introuvable — NotFoundError", async () => {
    mockRepository.findById.mockResolvedValue(null);
    await expect(
      service.update({
        id: "unknown",
        data: {} as any,
        userId: CLIENT_ID,
        role: "CLIENT" as any,
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("client non-propriétaire et non-staff — ForbiddenError", async () => {
    mockRepository.findById.mockResolvedValue(makeMeetingWithAnimal());

    await expect(
      service.update({
        id: "meeting-1",
        data: {} as any,
        userId: "other-client",
        role: "CLIENT" as any,
      }),
    ).rejects.toThrow(ForbiddenError);
  });

  it("pas de changement de créneau — update direct sans vérification de dispo", async () => {
    mockRepository.findById.mockResolvedValue(makeMeetingWithAnimal());
    mockRepository.update.mockResolvedValue(makeMeetingWithAnimal().meeting);

    await service.update({
      id: "meeting-1",
      data: { description: "Nouvelle description" } as any,
      userId: CLIENT_ID,
      role: "CLIENT" as any,
    });

    expect(mockPrisma.meetingBase.findFirst).not.toHaveBeenCalled();
    expect(mockRepository.update).toHaveBeenCalled();
  });

  it("client déplace le RDV à moins de 48h — ForbiddenError", async () => {
    const soonDate = new Date(Date.now() + 60 * 60 * 1000); // dans 1h
    mockRepository.findById.mockResolvedValue(
      makeMeetingWithAnimal({
        meeting: {
          id: "base-1",
          date: soonDate,
          startTime: FAR_FUTURE_START,
          endTime: FAR_FUTURE_END,
        },
      }),
    );

    await expect(
      service.update({
        id: "meeting-1",
        data: { startTime: new Date("1970-01-01T10:00:00.000Z") } as any,
        userId: CLIENT_ID,
        role: "CLIENT" as any,
      }),
    ).rejects.toThrow(ForbiddenError);
  });

  it("staff peut déplacer un RDV à moins de 48h", async () => {
    const soonDate = new Date(Date.now() + 60 * 60 * 1000);
    mockRepository.findById.mockResolvedValue(
      makeMeetingWithAnimal({
        meeting: {
          id: "base-1",
          date: soonDate,
          startTime: FAR_FUTURE_START,
          endTime: FAR_FUTURE_END,
        },
      }),
    );
    mockPrisma.meetingBase.findFirst.mockResolvedValue(null); // pas de conflit
    mockPrisma.meetingReccuring.findFirst.mockResolvedValue({
      id: "recurring-1",
    }); // dispo trouvée
    mockRepository.update.mockResolvedValue({
      meeting: {
        date: FAR_FUTURE_DATE,
        startTime: FAR_FUTURE_START,
        endTime: FAR_FUTURE_END,
      },
    });

    await service.update({
      id: "meeting-1",
      data: { date: FAR_FUTURE_DATE },
      userId: "staff-1",
      role: "VETERINARIAN" as any,
    });

    expect(mockRepository.update).toHaveBeenCalled();
  });

  it("BadRequestError si le nouveau créneau est dans le passé", async () => {
    mockRepository.findById.mockResolvedValue(makeMeetingWithAnimal());

    await expect(
      service.update({
        id: "meeting-1",
        data: { date: new Date("2020-01-01") } as any,
        userId: "staff-1",
        role: "VETERINARIAN" as any,
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it("envoie un email 'updatedConfirmation' si c'est le client propriétaire qui reschedule", async () => {
    mockRepository.findById.mockResolvedValue(makeMeetingWithAnimal());
    mockPrisma.meetingBase.findFirst.mockResolvedValue(null);
    mockPrisma.meetingReccuring.findFirst.mockResolvedValue({
      id: "recurring-1",
    });
    mockRepository.update.mockResolvedValue({
      meeting: {
        date: FAR_FUTURE_DATE,
        startTime: FAR_FUTURE_START,
        endTime: FAR_FUTURE_END,
      },
    });

    await service.update({
      id: "meeting-1",
      data: { date: new Date("2099-07-01") },
      userId: CLIENT_ID,
      role: "CLIENT" as any,
    });

    expect(mockEmailService.sendAppointmentEmail).toHaveBeenCalledWith(
      "updatedConfirmation",
      "client@gmail.com",
      expect.anything(),
    );
  });

  it("envoie un email 'rescheduled' si c'est le staff qui reschedule", async () => {
    mockRepository.findById.mockResolvedValue(makeMeetingWithAnimal());
    mockPrisma.meetingBase.findFirst.mockResolvedValue(null);
    mockPrisma.meetingReccuring.findFirst.mockResolvedValue({
      id: "recurring-1",
    });
    mockRepository.update.mockResolvedValue({
      meeting: {
        date: FAR_FUTURE_DATE,
        startTime: FAR_FUTURE_START,
        endTime: FAR_FUTURE_END,
      },
    });

    await service.update({
      id: "meeting-1",
      data: { date: new Date("2099-07-01") },
      userId: "staff-1",
      role: "VETERINARIAN" as any,
    });

    expect(mockEmailService.sendAppointmentEmail).toHaveBeenCalledWith(
      "rescheduled",
      "client@gmail.com",
      expect.anything(),
    );
  });
});

// ── delete ───────────────────────────────────────────────────────────────────

describe("AnimalMeetingService.delete", () => {
  it("introuvable — NotFoundError", async () => {
    mockRepository.findById.mockResolvedValue(null);
    await expect(
      service.delete({
        id: "unknown",
        userId: CLIENT_ID,
        role: "CLIENT" as any,
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("client non-propriétaire — ForbiddenError", async () => {
    mockRepository.findById.mockResolvedValue(makeMeetingWithAnimal());

    await expect(
      service.delete({
        id: "meeting-1",
        userId: "other-client",
        role: "CLIENT" as any,
      }),
    ).rejects.toThrow(ForbiddenError);
  });

  it("RDV déjà passé — BadRequestError", async () => {
    mockRepository.findById.mockResolvedValue(
      makeMeetingWithAnimal({
        meeting: {
          id: "base-1",
          date: new Date("2020-01-01"),
          startTime: FAR_FUTURE_START,
          endTime: FAR_FUTURE_END,
        },
      }),
    );

    await expect(
      service.delete({
        id: "meeting-1",
        userId: CLIENT_ID,
        role: "CLIENT" as any,
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it("client annule à moins de 48h — ForbiddenError", async () => {
    const soonDate = new Date(Date.now() + 60 * 60 * 1000);
    const soonEnd = new Date(Date.now() + 90 * 60 * 1000);
    mockRepository.findById.mockResolvedValue(
      makeMeetingWithAnimal({
        meeting: {
          id: "base-1",
          date: soonDate,
          startTime: soonDate,
          endTime: soonEnd,
        },
      }),
    );

    await expect(
      service.delete({
        id: "meeting-1",
        userId: CLIENT_ID,
        role: "CLIENT" as any,
      }),
    ).rejects.toThrow(ForbiddenError);
  });

  it("supprime et envoie un email d'annulation", async () => {
    mockRepository.findById.mockResolvedValue(makeMeetingWithAnimal());
    mockRepository.delete.mockResolvedValue({ id: "base-1" });

    await service.delete({
      id: "meeting-1",
      userId: CLIENT_ID,
      role: "CLIENT" as any,
    });

    expect(mockRepository.delete).toHaveBeenCalledWith("meeting-1");
    expect(mockEmailService.sendAppointmentEmail).toHaveBeenCalledWith(
      "cancelled",
      "client@gmail.com",
      expect.anything(),
    );
  });
});

// ── getAllByClient ────────────────────────────────────────────────────────────

describe("AnimalMeetingService.getAllByClient", () => {
  it("BadRequestError si id absent", async () => {
    await expect(
      service.getAllByClient({
        id: undefined as any,
        userId: CLIENT_ID,
        role: "CLIENT" as any,
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it("NotFoundError si l'utilisateur cible n'existe pas", async () => {
    mockUserRepository.getUserById.mockResolvedValue(null);

    await expect(
      service.getAllByClient({
        id: CLIENT_ID as any,
        userId: CLIENT_ID,
        role: "CLIENT" as any,
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("client demandant les RDV d'un autre client — ForbiddenError", async () => {
    mockUserRepository.getUserById.mockResolvedValue({ id: "other-client" });

    await expect(
      service.getAllByClient({
        id: "other-client" as any,
        userId: CLIENT_ID,
        role: "CLIENT" as any,
      }),
    ).rejects.toThrow(ForbiddenError);
  });

  it("staff peut consulter les RDV de n'importe quel client", async () => {
    mockUserRepository.getUserById.mockResolvedValue({ id: CLIENT_ID });
    mockRepository.findByClient.mockResolvedValue([]);

    const result = await service.getAllByClient({
      id: CLIENT_ID as any,
      userId: "staff-1",
      role: "VETERINARIAN" as any,
    });

    expect(result).toHaveLength(0);
  });
});

// ── getByAnimal ───────────────────────────────────────────────────────────────

describe("AnimalMeetingService.getByAnimal", () => {
  it("NotFoundError si l'animal n'existe pas", async () => {
    mockPrisma.animal.findUnique.mockResolvedValue(null);

    await expect(
      service.getByAnimal({
        animalId: "unknown" as any,
        userId: CLIENT_ID,
        role: "CLIENT" as any,
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("client non-propriétaire de l'animal — ForbiddenError", async () => {
    mockPrisma.animal.findUnique.mockResolvedValue({
      clientId: "other-client",
    });

    await expect(
      service.getByAnimal({
        animalId: "animal-1" as any,
        userId: CLIENT_ID,
        role: "CLIENT" as any,
      }),
    ).rejects.toThrow(ForbiddenError);
  });

  it("client propriétaire — accès autorisé", async () => {
    mockPrisma.animal.findUnique.mockResolvedValue({ clientId: CLIENT_ID });
    mockRepository.findByAnimal.mockResolvedValue([]);

    const result = await service.getByAnimal({
      animalId: "animal-1" as any,
      userId: CLIENT_ID,
      role: "CLIENT" as any,
    });

    expect(result).toHaveLength(0);
  });
});

// ── getAnimalMeetingsAsVet ────────────────────────────────────────────────────

describe("AnimalMeetingService.getAnimalMeetingsAsVet", () => {
  const start = new Date("2026-01-01T00:00:00.000Z");
  const end = new Date("2026-01-31T00:00:00.000Z");

  it("aplatit les meetings via expandAll", async () => {
    mockRepository.findByVeterinarianAndClinic.mockResolvedValue([
      { meeting: null },
    ]);

    const result = await service.getAnimalMeetingsAsVet(
      VET_PROFILE_ID as any,
      start,
      end,
    );

    expect(result).toHaveLength(0);
  });

  it("propage clinicIds au repository, défaut tableau vide si absent", async () => {
    mockRepository.findByVeterinarianAndClinic.mockResolvedValue([]);

    await service.getAnimalMeetingsAsVet(VET_PROFILE_ID as any, start, end);

    expect(mockRepository.findByVeterinarianAndClinic).toHaveBeenCalledWith(
      VET_PROFILE_ID,
      start,
      end,
      [],
    );
  });
});
