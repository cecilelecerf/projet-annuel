import { describe, it, expect, vi, beforeEach } from "vitest";
import { BadRequestError, NotFoundError } from "@api/errors";

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockRepository = vi.hoisted(() => ({
  getClinicVets: vi.fn(),
}));

const mockClinicRepository = vi.hoisted(() => ({
  searchClinics: vi.fn(),
}));

const mockMeetingService = vi.hoisted(() => ({
  getAvailabilities: vi.fn(),
}));

// BookingService.create() utilise le singleton `prisma` global directement
// (pas injecté) : on doit donc mocker ce module pour tester create().
const mockPrisma = vi.hoisted(() => ({
  animal: { findFirst: vi.fn() },
  veterinarianClinic: { findFirst: vi.fn() },
  meetingBase: { findFirst: vi.fn(), create: vi.fn() },
}));

vi.mock("@api/lib/prisma", () => ({ prisma: mockPrisma }));

const { BookingService } = await import("../booking.service");

const service = new BookingService(
  mockRepository as any,
  mockClinicRepository as any,
  mockMeetingService as any,
);

// ── Fixtures ──────────────────────────────────────────────────────────────────

const CLIENT_ID = "11111111-1111-4111-8111-111111111111";
const ANIMAL_ID = "22222222-2222-4222-8222-222222222222";
const VET_ID = "33333333-3333-4333-8333-333333333333";
const CLINIC_ID = "44444444-4444-4444-8444-444444444444";

beforeEach(() => vi.clearAllMocks());

// ── searchClinics ──────────────────────────────────────────────────────────────

describe("BookingService.searchClinics", () => {
  const makeClinicCandidate = (overrides = {}) => ({
    id: CLINIC_ID,
    name: "Clinique Test",
    address: "1 rue de Paris",
    phone: "0102030405",
    description: null,
    openingHours: null,
    lat: 48.85,
    lng: 2.35,
    veterinarianClinics: [
      {
        veterinarian: {
          id: VET_ID,
          user: { id: "vet-user-1", availabilities: [] },
          specialities: [{ id: "spec-1", name: "Cardiologie" }],
        },
      },
    ],
    ...overrides,
  });

  it("exclut les cliniques sans aucun vétérinaire réellement disponible", async () => {
    mockClinicRepository.searchClinics.mockResolvedValue([
      makeClinicCandidate(),
    ]);
    mockMeetingService.getAvailabilities.mockResolvedValue([]); // aucune dispo réelle

    const result = await service.searchClinics({} as any);

    expect(result).toHaveLength(0);
  });

  it("inclut une clinique avec au moins un vétérinaire disponible", async () => {
    mockClinicRepository.searchClinics.mockResolvedValue([
      makeClinicCandidate(),
    ]);
    mockMeetingService.getAvailabilities.mockResolvedValue([{ id: "avail-1" }]);

    const result = await service.searchClinics({} as any);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: CLINIC_ID,
      name: "Clinique Test",
      vetCount: 1,
      specialities: ["Cardiologie"],
      rating: null,
    });
  });

  it("calcule la distance et trie par proximité croissante", async () => {
    const near = makeClinicCandidate({
      id: "near",
      lat: 48.8566,
      lng: 2.3522,
    });
    const far = makeClinicCandidate({ id: "far", lat: 45.75, lng: 4.85 }); // Lyon

    mockClinicRepository.searchClinics.mockResolvedValue([far, near]);
    mockMeetingService.getAvailabilities.mockResolvedValue([{ id: "avail-1" }]);

    const result = await service.searchClinics({
      lat: 48.8566,
      lng: 2.3522,
      radiusKm: 500, // large pour ne tester que le tri, pas le filtre par rayon
    } as any);

    expect(result.map((c) => c.id)).toEqual(["near", "far"]);
    expect(result[0].distanceKm).toBeLessThan(result[1].distanceKm);
  });

  it("filtre les cliniques hors du rayon de recherche", async () => {
    const near = makeClinicCandidate({
      id: "near",
      lat: 48.8566,
      lng: 2.3522,
    });
    const far = makeClinicCandidate({ id: "far", lat: 45.75, lng: 4.85 });

    mockClinicRepository.searchClinics.mockResolvedValue([near, far]);
    mockMeetingService.getAvailabilities.mockResolvedValue([{ id: "avail-1" }]);

    const result = await service.searchClinics({
      lat: 48.8566,
      lng: 2.3522,
      radiusKm: 20,
    } as any);

    expect(result.map((c) => c.id)).toEqual(["near"]);
  });

  it("sans lat/lng, ne filtre pas par distance (toutes les cliniques incluses)", async () => {
    const near = makeClinicCandidate({ id: "near" });
    const far = makeClinicCandidate({ id: "far", lat: 45.75, lng: 4.85 });

    mockClinicRepository.searchClinics.mockResolvedValue([near, far]);
    mockMeetingService.getAvailabilities.mockResolvedValue([{ id: "avail-1" }]);

    const result = await service.searchClinics({} as any);

    expect(result).toHaveLength(2);
  });

  it("dédoublonne les spécialités de plusieurs vétérinaires", async () => {
    const clinic = makeClinicCandidate({
      veterinarianClinics: [
        {
          veterinarian: {
            id: "vet-1",
            user: { id: "u1", availabilities: [] },
            specialities: [{ id: "s1", name: "Cardiologie" }],
          },
        },
        {
          veterinarian: {
            id: "vet-2",
            user: { id: "u2", availabilities: [] },
            specialities: [{ id: "s1", name: "Cardiologie" }],
          },
        },
      ],
    });
    mockClinicRepository.searchClinics.mockResolvedValue([clinic]);
    mockMeetingService.getAvailabilities.mockResolvedValue([{ id: "avail-1" }]);

    const result = await service.searchClinics({} as any);

    expect(result[0].specialities).toEqual(["Cardiologie"]);
  });
});

// ── getClinicVets ──────────────────────────────────────────────────────────────

describe("BookingService.getClinicVets", () => {
  it("mappe la réponse du repository dans le format attendu", async () => {
    mockRepository.getClinicVets.mockResolvedValue([
      {
        veterinarian: {
          id: VET_ID,
          bio: "Vétérinaire généraliste",
          user: {
            firstname: "Jean",
            lastname: "Martin",
            avatarUrl: null,
          },
          specialities: [{ id: "s1", name: "Cardiologie" }],
        },
      },
    ]);

    const result = await service.getClinicVets({ clinicId: CLINIC_ID });

    expect(mockRepository.getClinicVets).toHaveBeenCalledWith({
      clinicId: CLINIC_ID,
    });
    expect(result).toEqual([
      {
        id: VET_ID,
        bio: "Vétérinaire généraliste",
        user: {
          firstname: "Jean",
          lastname: "Martin",
          avatarUrl: null,
        },
        specialities: [{ id: "s1", name: "Cardiologie" }],
        rating: null,
      },
    ]);
  });

  it("retourne un tableau vide si aucun vétérinaire disponible", async () => {
    mockRepository.getClinicVets.mockResolvedValue([]);

    const result = await service.getClinicVets({ clinicId: CLINIC_ID });

    expect(result).toEqual([]);
  });
});

// ── create ─────────────────────────────────────────────────────────────────────

describe("BookingService.create", () => {
  const bookingData = {
    animalId: ANIMAL_ID,
    veterinarianId: VET_ID,
    date: new Date("2027-01-15"),
    startTime: new Date("2027-01-15T10:00:00.000Z"),
    endTime: new Date("2027-01-15T10:30:00.000Z"),
    description: "Consultation de routine",
    specialityId: undefined,
  } as any;

  it("animal introuvable ou non autorisé — BadRequestError", async () => {
    mockPrisma.animal.findFirst.mockResolvedValue(null);

    await expect(service.create(bookingData, CLIENT_ID)).rejects.toThrow(
      BadRequestError,
    );
    expect(mockPrisma.meetingBase.create).not.toHaveBeenCalled();
  });

  it("vétérinaire non rattaché à une clinique — NotFoundError", async () => {
    mockPrisma.animal.findFirst.mockResolvedValue({ id: ANIMAL_ID });
    mockPrisma.veterinarianClinic.findFirst.mockResolvedValue(null);

    await expect(service.create(bookingData, CLIENT_ID)).rejects.toThrow(
      NotFoundError,
    );
    expect(mockPrisma.meetingBase.create).not.toHaveBeenCalled();
  });

  it("créneau déjà pris — BadRequestError", async () => {
    mockPrisma.animal.findFirst.mockResolvedValue({ id: ANIMAL_ID });
    mockPrisma.veterinarianClinic.findFirst.mockResolvedValue({
      id: "vc-1",
    });
    mockPrisma.meetingBase.findFirst.mockResolvedValue({ id: "conflict-1" });

    await expect(service.create(bookingData, CLIENT_ID)).rejects.toThrow(
      BadRequestError,
    );
    expect(mockPrisma.meetingBase.create).not.toHaveBeenCalled();
  });

  it("crée le rendez-vous quand tout est valide", async () => {
    mockPrisma.animal.findFirst.mockResolvedValue({ id: ANIMAL_ID });
    mockPrisma.veterinarianClinic.findFirst.mockResolvedValue({
      id: "vc-1",
    });
    mockPrisma.meetingBase.findFirst.mockResolvedValue(null);
    mockPrisma.meetingBase.create.mockResolvedValue({
      id: "meeting-1",
      date: bookingData.date,
      startTime: bookingData.startTime,
      endTime: bookingData.endTime,
      animalMeeting: {
        veterinarianClinic: {
          clinic: { id: CLINIC_ID, name: "Clinique Test", address: "1 rue" },
          veterinarian: {
            id: VET_ID,
            user: { firstname: "Jean", lastname: "Martin" },
          },
        },
        animal: { id: ANIMAL_ID, name: "Rex" },
      },
    });

    const result = await service.create(bookingData, CLIENT_ID);

    expect(mockPrisma.meetingBase.create).toHaveBeenCalled();
    expect(result).toMatchObject({
      meetingId: "meeting-1",
      clinic: { id: CLINIC_ID, name: "Clinique Test" },
      vet: { id: VET_ID, user: { firstname: "Jean", lastname: "Martin" } },
      animal: { id: ANIMAL_ID, name: "Rex" },
    });
  });
});
