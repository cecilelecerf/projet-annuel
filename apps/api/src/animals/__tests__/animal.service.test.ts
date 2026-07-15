import { describe, it, expect, vi, beforeEach } from "vitest";
import { ForbiddenError, NotFoundError } from "@api/errors";
import { CreateAnimal, UserId } from "@armali/schemas";

// ── Mock ──────────────────────────────────────────────────────────────────────

const mockAnimalRepository = vi.hoisted(() => ({
  findAll: vi.fn(),
  findById: vi.fn(),
  findByClientId: vi.fn(),
  findVaccinesByAnimal: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  markDeceased: vi.fn(),
  updatePhoto: vi.fn(),
  findByEmergencyToken: vi.fn(),
  findPaginatedByAttendingVeterinarian: vi.fn(),
  findPaginatedByAttendingClinic: vi.fn(),
}));

const mockVaccineRepository = vi.hoisted(() => ({
  findByPetId: vi.fn(),
}));

const mockClinicRepository = vi.hoisted(() => ({
  findClinicByUserId: vi.fn(),
  findClinicIdByUser: vi.fn(),
  findClientsById: vi.fn(),
}));

vi.mock("@api/animals/animal.repository", () => ({
  AnimalRepository: vi.fn(function () {
    return mockAnimalRepository;
  }),
}));

vi.mock("@api/vaccines/vaccine.repository", () => ({
  VaccineRepository: vi.fn(function () {
    return mockVaccineRepository;
  }),
}));
vi.mock("@api/clinic/clinic.repository", () => ({
  ClinicRepository: vi.fn(function () {
    return mockClinicRepository;
  }),
}));
const mockPrisma = vi.hoisted(() => ({
  vaccine: { findMany: vi.fn() },
}));

vi.mock("@api/lib/prisma", () => ({ prisma: mockPrisma }));
const { ClinicRepository } = await import("@api/clinics/clinic.repository");

const { AnimalRepository } = await import("@api/animals/animal.repository");
const { VaccineRepository } = await import("@api/vaccines/vaccine.repository");
const { AnimalService } = await import("@api/animals/animal.service");
const { VeterinarianProfileRepository } =
  await import("@api/veterinarians/veterinarian-profile.repository");
const { ClinicService } = await import("@api/clinics/clinic.service");

const clinicService = new ClinicService(new ClinicRepository({} as any));

const animalService = new AnimalService(
  new AnimalRepository({} as any),
  new VaccineRepository({} as any),
  clinicService,
  new VeterinarianProfileRepository({} as any),
  {} as any,
);

// ── Fixtures ──────────────────────────────────────────────────────────────────

const makeAnimal = (overrides = {}) => ({
  id: "animal-1",
  name: "Rex",
  dateOfBirth: new Date("2020-01-01"),
  description: null,
  activity: null,
  outdoorAccess: false,
  animalContact: false,
  attendingVeterinarianClinicId: null,
  clientId: "client-profile-1",
  raceId: "race-1",
  photoId: null,
  emergencyToken: "emergency-token-1",
  createdAt: new Date(),
  updatedAt: new Date(),
  client: {
    country: "FR",
    phone: null,
    user: {
      id: "client-profile-1",
      firstname: "Alice",
      lastname: "Durand",
      avatarUrl: null,
    },
  },
  race: { petId: "pet-1", name: "Labrador", pet: { name: "Chien" } },
  attendingVeterinarianClinic: null,
  animalConditionHealths: [],
  photoUrl: null,
  ...overrides,
});
const makeVaccine = (overrides = {}) => ({
  id: "vaccine-1",
  recommendedAge: 8,
  boosterInterval: 52,
  petId: "pet-1",
  act: null,
  countryRules: [],
  ...overrides,
});

const makeAnimalVaccine = (overrides = {}) => ({
  id: "animal-vaccine-1",
  vaccineId: "vaccine-1",
  animalId: "animal-1",
  vaccine: makeVaccine(),
  medicalHistory: { performedAt: new Date("2024-01-01") },
  ...overrides,
});

beforeEach(() => vi.clearAllMocks());

// ── getAll ────────────────────────────────────────────────────────────────────

describe("AnimalService.getAll", () => {
  it("STAFF — retourne tous les animaux", async () => {
    mockAnimalRepository.findAll.mockResolvedValue([makeAnimal()]);

    const result = await animalService.getAll({
      userId: "user-1",
      role: "VETERINARIAN",
    });

    expect(mockAnimalRepository.findAll).toHaveBeenCalledOnce();
    expect(mockAnimalRepository.findByClientId).not.toHaveBeenCalled();
    expect(result).toHaveLength(1);
  });

  it("CLIENT — retourne uniquement ses animaux", async () => {
    mockAnimalRepository.findByClientId.mockResolvedValue([makeAnimal()]);

    const result = await animalService.getAll({
      userId: "client-profile-1",
      role: "CLIENT",
    });

    expect(mockAnimalRepository.findByClientId).toHaveBeenCalledWith(
      "client-profile-1",
    );
    expect(mockAnimalRepository.findAll).not.toHaveBeenCalled();
    expect(result).toHaveLength(1);
  });
});

// ── getByUser ─────────────────────────────────────────────────────────────────

describe("AnimalService.getByUser", () => {
  it("CLIENT accède à ses propres animaux", async () => {
    mockAnimalRepository.findByClientId.mockResolvedValue([makeAnimal()]);

    const result = await animalService.getByUser({
      targetUserId: "user-1",
      requesterId: "user-1",
      role: "CLIENT",
    });

    expect(mockAnimalRepository.findByClientId).toHaveBeenCalledWith("user-1");
    expect(result).toHaveLength(1);
  });

  it("CLIENT accède aux animaux d'un autre — ForbiddenError", async () => {
    await expect(
      animalService.getByUser({
        targetUserId: "other-user",
        requesterId: "user-1",
        role: "CLIENT",
      }),
    ).rejects.toThrow(ForbiddenError);
  });

  it("STAFF accède aux animaux de n'importe quel utilisateur", async () => {
    mockAnimalRepository.findByClientId.mockResolvedValue([makeAnimal()]);

    const result = await animalService.getByUser({
      targetUserId: "other-user",
      requesterId: "user-1",
      role: "VETERINARIAN",
    });

    expect(mockAnimalRepository.findByClientId).toHaveBeenCalledWith(
      "other-user",
    );
    expect(result).toHaveLength(1);
  });
});

// ── getById ───────────────────────────────────────────────────────────────────

describe("AnimalService.getById", () => {
  it("animal introuvable — NotFoundError", async () => {
    mockAnimalRepository.findById.mockResolvedValue(null);

    await expect(
      animalService.getById({
        id: "unknown",
        userId: "user-1",
        role: "CLIENT",
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("CLIENT accède à l'animal d'un autre — ForbiddenError", async () => {
    mockAnimalRepository.findById.mockResolvedValue(
      makeAnimal({ clientId: "other-client" }),
    );

    await expect(
      animalService.getById({
        id: "animal-1",
        userId: "client-profile-1",
        role: "CLIENT",
      }),
    ).rejects.toThrow(ForbiddenError);
  });

  it("CLIENT accède à son propre animal", async () => {
    const animal = makeAnimal({ clientId: "client-profile-1" });
    mockAnimalRepository.findById.mockResolvedValue(animal);

    const result = await animalService.getById({
      id: "animal-1",
      userId: "client-profile-1",
      role: "CLIENT",
    });

    expect(result).toBeDefined();
  });

  it("STAFF accède à n'importe quel animal", async () => {
    const animal = makeAnimal({ clientId: "other-client" });
    mockAnimalRepository.findById.mockResolvedValue(animal);

    const result = await animalService.getById({
      id: "animal-1",
      userId: "user-staff",
      role: "VETERINARIAN",
    });

    expect(result).toBeDefined();
  });
});

// ── create ────────────────────────────────────────────────────────────────────

describe("AnimalService.create", () => {
  const baseData = {
    name: "Rex",
    dateOfBirth: new Date("2020-01-01"),
    raceId: "race-1",
  } as CreateAnimal;

  it("CLIENT — clientId forcé à userId", async () => {
    const created = makeAnimal({ clientId: "client-profile-1" });
    mockAnimalRepository.create.mockResolvedValue(created);

    await animalService.create({
      data: baseData as any,
      userId: "client-profile-1" as UserId,
      role: "CLIENT",
    });

    expect(mockAnimalRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ clientId: "client-profile-1" }),
    );
  });

  it("STAFF — clientId pris depuis data si fourni", async () => {
    const created = makeAnimal({ clientId: "other-client" });
    mockAnimalRepository.create.mockResolvedValue(created);

    await animalService.create({
      data: { ...baseData, clientId: "other-client" } as any,
      userId: "user-staff" as UserId,
      role: "SECRETARY",
    });

    expect(mockAnimalRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ clientId: "other-client" }),
    );
  });

  it("STAFF — clientId fallback sur userId si absent de data", async () => {
    const created = makeAnimal({ clientId: "user-staff" });
    mockAnimalRepository.create.mockResolvedValue(created);

    await animalService.create({
      data: baseData,
      userId: "user-staff" as UserId,
      role: "SECRETARY",
    });

    expect(mockAnimalRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ clientId: "user-staff" }),
    );
  });
});

// ── update ────────────────────────────────────────────────────────────────────

describe("AnimalService.update", () => {
  it("animal introuvable — NotFoundError", async () => {
    mockAnimalRepository.findById.mockResolvedValue(null);

    await expect(
      animalService.update({
        id: "unknown",
        data: { name: "Nouveau" } as any,
        userId: "user-1",
        role: "CLIENT",
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("CLIENT modifie l'animal d'un autre — ForbiddenError", async () => {
    mockAnimalRepository.findById.mockResolvedValue(
      makeAnimal({ clientId: "other-client" }),
    );

    await expect(
      animalService.update({
        id: "animal-1",
        data: { name: "Nouveau" } as any,
        userId: "client-profile-1",
        role: "CLIENT",
      }),
    ).rejects.toThrow(ForbiddenError);
  });

  it("CLIENT modifie son propre animal", async () => {
    mockAnimalRepository.findById.mockResolvedValue(
      makeAnimal({ clientId: "client-profile-1" }),
    );
    mockAnimalRepository.update.mockResolvedValue(
      makeAnimal({ name: "Nouveau" }),
    );

    const result = await animalService.update({
      id: "animal-1",
      data: { name: "Nouveau" } as any,
      userId: "client-profile-1",
      role: "CLIENT",
    });

    expect(mockAnimalRepository.update).toHaveBeenCalledWith(
      "animal-1",
      expect.objectContaining({ name: "Nouveau" }),
    );
    expect(result).toHaveProperty("name", "Nouveau");
  });

  it("STAFF modifie n'importe quel animal sans vérification", async () => {
    mockAnimalRepository.findById.mockResolvedValue(
      makeAnimal({ clientId: "other-client" }),
    );
    mockAnimalRepository.update.mockResolvedValue(makeAnimal());

    await animalService.update({
      id: "animal-1",
      data: { name: "Staff edit" } as any,
      userId: "user-staff",
      role: "VETERINARIAN",
    });

    expect(mockAnimalRepository.update).toHaveBeenCalledOnce();
  });
});

// ── delete ────────────────────────────────────────────────────────────────────

describe("AnimalService.delete", () => {
  it("animal introuvable — NotFoundError", async () => {
    mockAnimalRepository.findById.mockResolvedValue(null);

    await expect(
      animalService.delete({
        id: "unknown",
        userId: "user-1",
        reasons: ["OTHER"],
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("CLIENT supprime l'animal d'un autre — ForbiddenError", async () => {
    mockAnimalRepository.findById.mockResolvedValue(
      makeAnimal({ clientId: "other-client" }),
    );

    await expect(
      animalService.delete({
        id: "animal-1",
        userId: "client-profile-1",
        reasons: ["OTHER"],
      }),
    ).rejects.toThrow(ForbiddenError);
  });

  it("CLIENT supprime son propre animal", async () => {
    mockAnimalRepository.findById.mockResolvedValue(
      makeAnimal({ clientId: "client-profile-1" }),
    );
    mockAnimalRepository.delete.mockResolvedValue(undefined);

    await animalService.delete({
      id: "animal-1",
      userId: "client-profile-1",
      reasons: ["OTHER"],
    });

    expect(mockAnimalRepository.delete).toHaveBeenCalledWith("animal-1");
  });

  it("STAFF ne peut pas supprimer l'animal d'un client", async () => {
    mockAnimalRepository.findById.mockResolvedValue(
      makeAnimal({ clientId: "other-client" }),
    );

    await expect(
      animalService.delete({
        id: "animal-1",
        userId: "user-staff",
        reasons: ["OTHER"],
      }),
    ).rejects.toThrow(ForbiddenError);

    expect(mockAnimalRepository.delete).not.toHaveBeenCalled();
  });

  it("DECEASED — marque l'animal comme décédé plutôt que de le supprimer", async () => {
    mockAnimalRepository.findById.mockResolvedValue(
      makeAnimal({ clientId: "client-profile-1" }),
    );
    mockAnimalRepository.markDeceased.mockResolvedValue(
      makeAnimal({ clientId: "client-profile-1" }),
    );

    await animalService.delete({
      id: "animal-1",
      userId: "client-profile-1",
      reasons: ["DECEASED"],
    });

    expect(mockAnimalRepository.markDeceased).toHaveBeenCalledWith("animal-1");
    expect(mockAnimalRepository.delete).not.toHaveBeenCalled();
  });
});

// ── getVaccinesByAnimal ───────────────────────────────────────────────────────

describe("AnimalService.getVaccinesByAnimal", () => {
  it("animal introuvable — NotFoundError", async () => {
    mockAnimalRepository.findById.mockResolvedValue(null);

    await expect(animalService.getVaccinesByAnimal("unknown")).rejects.toThrow(
      NotFoundError,
    );
  });

  it("retourne un tableau vide si aucun vaccin pour l'espèce", async () => {
    mockAnimalRepository.findById.mockResolvedValue(makeAnimal());
    mockAnimalRepository.findVaccinesByAnimal.mockResolvedValue([]);
    mockVaccineRepository.findByPetId.mockResolvedValue([]);

    const result = await animalService.getVaccinesByAnimal("animal-1");

    expect(result).toHaveLength(0);
  });

  it("vaccin effectué — status UP_TO_DATE si pas encore échu", async () => {
    mockAnimalRepository.findById.mockResolvedValue(makeAnimal());
    const animalVaccine = makeAnimalVaccine({
      medicalHistory: { performedAt: new Date() },
    });
    mockAnimalRepository.findVaccinesByAnimal.mockResolvedValue([
      animalVaccine,
    ]);
    mockVaccineRepository.findByPetId.mockResolvedValue([makeVaccine()]);

    const result = await animalService.getVaccinesByAnimal("animal-1");

    expect(result[0]).toHaveProperty("status", "UP_TO_DATE");
  });

  it("vaccin effectué — status OVERDUE si rappel dépassé", async () => {
    mockAnimalRepository.findById.mockResolvedValue(makeAnimal());
    const animalVaccine = makeAnimalVaccine({
      medicalHistory: { performedAt: new Date("2020-01-01") },
    });
    mockAnimalRepository.findVaccinesByAnimal.mockResolvedValue([
      animalVaccine,
    ]);
    mockVaccineRepository.findByPetId.mockResolvedValue([makeVaccine()]);

    const result = await animalService.getVaccinesByAnimal("animal-1");

    expect(result[0]).toHaveProperty("status", "OVERDUE");
  });

  it("vaccin non effectué — status MANDATORY_MISSING si règle obligatoire et âge atteint", async () => {
    mockAnimalRepository.findById.mockResolvedValue(
      makeAnimal({
        dateOfBirth: new Date("2020-01-01"),
        client: { country: "FR" },
      }),
    );
    mockAnimalRepository.findVaccinesByAnimal.mockResolvedValue([]);
    mockVaccineRepository.findByPetId.mockResolvedValue([
      makeVaccine({
        countryRules: [{ country: "FR", type: "MANDATORY", minAge: 8 }],
      }),
    ]);

    const result = await animalService.getVaccinesByAnimal("animal-1");

    expect(result[0]).toHaveProperty("status", "MANDATORY_MISSING");
  });

  it("vaccin non effectué — status RECOMMENDED_MISSING si règle recommandée et âge atteint", async () => {
    mockAnimalRepository.findById.mockResolvedValue(
      makeAnimal({
        dateOfBirth: new Date("2020-01-01"),
        client: { country: "FR" },
      }),
    );
    mockAnimalRepository.findVaccinesByAnimal.mockResolvedValue([]);
    mockVaccineRepository.findByPetId.mockResolvedValue([
      makeVaccine({
        countryRules: [{ country: "FR", type: "RECOMMENDED", minAge: 8 }],
      }),
    ]);

    const result = await animalService.getVaccinesByAnimal("animal-1");

    expect(result[0]).toHaveProperty("status", "RECOMMENDED_MISSING");
  });

  it("vaccin non effectué — status NOT_APPLICABLE si aucune règle pour le pays", async () => {
    mockAnimalRepository.findById.mockResolvedValue(
      makeAnimal({ client: { country: "FR" } }),
    );
    mockAnimalRepository.findVaccinesByAnimal.mockResolvedValue([]);
    mockVaccineRepository.findByPetId.mockResolvedValue([
      makeVaccine({
        countryRules: [{ country: "DE", type: "MANDATORY", minAge: 8 }],
      }),
    ]);

    const result = await animalService.getVaccinesByAnimal("animal-1");

    expect(result[0]).toHaveProperty("status", "NOT_APPLICABLE");
  });
});

// ── uploadPhoto ──────────────────────────────────────────────────────────────

describe("AnimalService.uploadPhoto", () => {
  it("CLIENT — ForbiddenError si ce n'est pas son animal", async () => {
    mockAnimalRepository.findById.mockResolvedValue(
      makeAnimal({ clientId: "other-client" }),
    );

    await expect(
      animalService.uploadPhoto({
        animalId: "animal-1",
        userId: "client-profile-1",
        role: "CLIENT",
        mimeType: "image/jpeg",
      }),
    ).rejects.toThrow(ForbiddenError);
  });

  it("délègue la création d'upload au FileService", async () => {
    const fileServiceMock = {
      createUpload: vi.fn().mockResolvedValue({ uploadUrl: "http://x" }),
    };
    const service = new AnimalService(
      new AnimalRepository({} as any),
      new VaccineRepository({} as any),
      clinicService,
      new VeterinarianProfileRepository({} as any),
      fileServiceMock as any,
    );
    mockAnimalRepository.findById.mockResolvedValue(
      makeAnimal({ clientId: "client-profile-1" }),
    );

    const result = await service.uploadPhoto({
      animalId: "animal-1",
      userId: "client-profile-1",
      role: "CLIENT",
      mimeType: "image/jpeg",
    });

    expect(fileServiceMock.createUpload).toHaveBeenCalledWith({
      entityType: "ANIMAL",
      entityId: "animal-1",
      mimeType: "image/jpeg",
      type: "IMAGE",
    });
    expect(result).toEqual({ uploadUrl: "http://x" });
  });
});

// ── confirmPhotoUpload ───────────────────────────────────────────────────────

describe("AnimalService.confirmPhotoUpload", () => {
  it("NotFoundError si l'animal n'existe pas après vérification d'accès", async () => {
    mockAnimalRepository.findById.mockResolvedValueOnce(
      makeAnimal({ clientId: "client-profile-1" }),
    );
    mockAnimalRepository.findById.mockResolvedValueOnce(null);

    await expect(
      animalService.confirmPhotoUpload({
        animalId: "animal-1",
        userId: "client-profile-1",
        role: "CLIENT",
        fileId: "file-1",
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("remplace la photo et nettoie l'ancienne (best-effort)", async () => {
    const fileServiceMock = {
      confirmUpload: vi.fn().mockResolvedValue({ id: "new-photo-id" }),
      deleteFile: vi.fn().mockResolvedValue(undefined),
    };
    const service = new AnimalService(
      new AnimalRepository({} as any),
      new VaccineRepository({} as any),
      clinicService,
      new VeterinarianProfileRepository({} as any),
      fileServiceMock as any,
    );
    const animal = makeAnimal({
      clientId: "client-profile-1",
      photoId: "old-photo-id",
    });
    mockAnimalRepository.findById.mockResolvedValue(animal);
    mockAnimalRepository.updatePhoto.mockResolvedValue(
      makeAnimal({ clientId: "client-profile-1" }),
    );

    await service.confirmPhotoUpload({
      animalId: "animal-1",
      userId: "client-profile-1",
      role: "CLIENT",
      fileId: "file-1",
    });

    expect(fileServiceMock.confirmUpload).toHaveBeenCalledWith({
      fileId: "file-1",
      expectedEntityType: "ANIMAL",
      expectedEntityId: "animal-1",
    });
    expect(fileServiceMock.deleteFile).toHaveBeenCalledWith("old-photo-id");
  });

  it("ne tente pas de suppression si l'animal n'avait pas de photo", async () => {
    const fileServiceMock = {
      confirmUpload: vi.fn().mockResolvedValue({ id: "new-photo-id" }),
      deleteFile: vi.fn(),
    };
    const service = new AnimalService(
      new AnimalRepository({} as any),
      new VaccineRepository({} as any),
      clinicService,
      new VeterinarianProfileRepository({} as any),
      fileServiceMock as any,
    );
    mockAnimalRepository.findById.mockResolvedValue(
      makeAnimal({ clientId: "client-profile-1", photoId: null }),
    );
    mockAnimalRepository.updatePhoto.mockResolvedValue(makeAnimal());

    await service.confirmPhotoUpload({
      animalId: "animal-1",
      userId: "client-profile-1",
      role: "CLIENT",
      fileId: "file-1",
    });

    expect(fileServiceMock.deleteFile).not.toHaveBeenCalled();
  });
});

// ── getEmergencyCard ─────────────────────────────────────────────────────────

describe("AnimalService.getEmergencyCard", () => {
  it("NotFoundError si le token est invalide", async () => {
    mockAnimalRepository.findByEmergencyToken.mockResolvedValue(null);

    await expect(
      animalService.getEmergencyCard("bad-token"),
    ).rejects.toThrow(NotFoundError);
  });

  it("retourne les informations d'urgence formatées, avec clinique", async () => {
    mockAnimalRepository.findByEmergencyToken.mockResolvedValue(
      makeAnimal({
        race: { name: "Labrador", pet: { name: "Chien" } },
        animalConditionHealths: [
          { healthCondition: { name: "Cardiaque" }, notes: "Suivi" },
        ],
        client: {
          user: { firstname: "Alice", lastname: "Durand" },
          phone: "0600000000",
        },
        attendingVeterinarianClinic: {
          clinic: {
            name: "Clinique X",
            phone: "0100000000",
            street: "1 rue Y",
            postalCode: "75001",
            city: "Paris",
          },
        },
      }),
    );

    const result = await animalService.getEmergencyCard("good-token");

    expect(result.species).toBe("Chien");
    expect(result.breed).toBe("Labrador");
    expect(result.owner.name).toBe("Alice Durand");
    expect(result.clinic).toEqual({
      name: "Clinique X",
      phone: "0100000000",
      address: "1 rue Y, 75001 Paris",
    });
  });

  it("clinic à null si aucun vétérinaire référent", async () => {
    mockAnimalRepository.findByEmergencyToken.mockResolvedValue(
      makeAnimal({
        race: { name: "Persan", pet: { name: "Chat" } },
        animalConditionHealths: [],
        client: { user: { firstname: "Bob", lastname: "Martin" }, phone: null },
        attendingVeterinarianClinic: null,
      }),
    );

    const result = await animalService.getEmergencyCard("good-token");

    expect(result.clinic).toBeNull();
  });
});

// ── getEmergencyQr ───────────────────────────────────────────────────────────

describe("AnimalService.getEmergencyQr", () => {
  it("ForbiddenError si ce n'est pas son animal", async () => {
    mockAnimalRepository.findById.mockResolvedValue(
      makeAnimal({ clientId: "other-client" }),
    );

    await expect(
      animalService.getEmergencyQr({
        id: "animal-1",
        userId: "client-profile-1",
        role: "CLIENT",
      }),
    ).rejects.toThrow(ForbiddenError);
  });

  it("génère l'URL et le QR code pour le propriétaire", async () => {
    mockAnimalRepository.findById.mockResolvedValue(
      makeAnimal({
        clientId: "client-profile-1",
        emergencyToken: "abc-123",
      }),
    );

    const result = await animalService.getEmergencyQr({
      id: "animal-1",
      userId: "client-profile-1",
      role: "CLIENT",
    });

    expect(result.url).toContain("abc-123");
    expect(result.qrCodeDataUrl).toMatch(/^data:image\/png/);
  });
});

// ── getAnimalByVeterinarian / getAnimalByClinic — accès refusé ───────────────

describe("AnimalService.getAnimalByVeterinarian", () => {
  it("ForbiddenError si le rôle n'est pas staff", async () => {
    await expect(
      animalService.getAnimalByVeterinarian(
        "vet-1" as UserId,
        "CLIENT",
        "client-1" as UserId,
        { page: 1, limit: 10, order: "desc" } as any,
      ),
    ).rejects.toThrow(ForbiddenError);
  });
});

describe("AnimalService.getAnimalByClinic", () => {
  it("ForbiddenError si le rôle n'est pas staff", async () => {
    await expect(
      animalService.getAnimalByClinic(
        "CLIENT",
        "client-1" as UserId,
        "clinic-1" as any,
        { page: 1, limit: 10, order: "desc" } as any,
      ),
    ).rejects.toThrow(ForbiddenError);
  });
});