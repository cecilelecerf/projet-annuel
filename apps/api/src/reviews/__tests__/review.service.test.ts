import { describe, it, expect, vi, beforeEach } from "vitest";

const mockReviewRepository = vi.hoisted(() => ({
  upsertReview: vi.fn(),
  findAll: vi.fn(),
  findReviewsByClient: vi.fn(),
  findReviewsByVeterinarian: vi.fn(),
  findReviewsByClinic: vi.fn(),
  findKeys: vi.fn(),
  getGlobalStats: vi.fn(),
  getStatsByVeterinarian: vi.fn(),
  getStatsByClinic: vi.fn(),
  getStatsByClient: vi.fn(),
}));

const mockClinicService = vi.hoisted(() => ({
  getClinicIdByUserId: vi.fn(),
}));

vi.mock("@api/reviews/review.repository", () => ({
  ReviewRepository: vi.fn(function () {
    return mockReviewRepository;
  }),
}));
vi.mock("@api/clinics/clinic.service", () => ({
  ClinicService: vi.fn(function () {
    return mockClinicService;
  }),
}));

const { ReviewRepository } = await import("@api/reviews/review.repository");
const { ReviewService } = await import("@api/reviews/review.service");
const { ClinicService } = await import("@api/clinics/clinic.service");

const reviewService = new ReviewService(
  new ReviewRepository({} as any),
  new ClinicService({} as any),
);

beforeEach(() => vi.clearAllMocks());

// Fixture reflétant la forme réelle de reviewWithRelationsInclude
const makeRawReview = (overrides: Partial<any> = {}) => ({
  id: "review-1",
  clientId: "client-1",
  veterinarianClinicId: "vc-1",
  rating: 5,
  comment: "Excellent",
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
  veterinarianClinic: {
    veterinarian: {
      user: { id: "vet-user-1", firstname: "Jean", lastname: "Dupont" },
    },
    clinic: { id: "clinic-1", name: "Clinique A" },
  },
  client: {
    user: { id: "client-user-1", firstname: "Marie", lastname: "Martin" },
  },
  ...overrides,
});

// ── upsertReview ──────────────────────────────────────────────────────────────

describe("ReviewService.upsertReview", () => {
  it("transmet les bons paramètres au repository", async () => {
    mockReviewRepository.upsertReview.mockResolvedValue(makeRawReview());

    const result = await reviewService.upsertReview("client-1", {
      veterinarianClinicId: "vc-1",
      rating: 5,
      comment: "Excellent",
    } as any);

    expect(mockReviewRepository.upsertReview).toHaveBeenCalledWith({
      clientId: "client-1",
      veterinarianClinicId: "vc-1",
      rating: 5,
      comment: "Excellent",
    });
    expect(result.id).toBe("review-1");
  });

  it("transforme comment undefined en null", async () => {
    mockReviewRepository.upsertReview.mockResolvedValue(makeRawReview());

    await reviewService.upsertReview("client-1", {
      veterinarianClinicId: "vc-1",
      rating: 3,
    } as any);

    expect(mockReviewRepository.upsertReview).toHaveBeenCalledWith({
      clientId: "client-1",
      veterinarianClinicId: "vc-1",
      rating: 3,
      comment: null,
    });
  });
});

// ── getReviewsByRole ─────────────────────────────────────────────────────────

describe("ReviewService.getReviewsByRole", () => {
  it("ADMIN reçoit tous les avis, formatés", async () => {
    mockReviewRepository.findAll.mockResolvedValue([makeRawReview()]);

    const result = await reviewService.getReviewsByRole({
      userId: "admin-1" as any,
      role: "ADMIN",
    });

    expect(mockReviewRepository.findAll).toHaveBeenCalled();
    expect(result).toHaveLength(1);
    expect(result[0].veterinarian).toEqual({
      id: "vet-user-1",
      firstname: "Jean",
      lastname: "Dupont",
    });
    expect(result[0].client).toEqual({
      id: "client-user-1",
      firstname: "Marie",
      lastname: "Martin",
    });
    expect(result[0].clinic).toEqual({ id: "clinic-1", name: "Clinique A" });
  });

  it("CLIENT reçoit ses propres avis via findReviewsByClient", async () => {
    mockReviewRepository.findReviewsByClient.mockResolvedValue([
      makeRawReview(),
    ]);

    const result = await reviewService.getReviewsByRole({
      userId: "client-1" as any,
      role: "CLIENT",
    });

    expect(mockReviewRepository.findReviewsByClient).toHaveBeenCalledWith(
      "client-1",
    );
    expect(result).toHaveLength(1);
  });

  it("VETERINARIAN reçoit ses avis via findReviewsByVeterinarian (PK partagée)", async () => {
    mockReviewRepository.findReviewsByVeterinarian.mockResolvedValue([
      makeRawReview(),
    ]);

    const result = await reviewService.getReviewsByRole({
      userId: "vet-1" as any,
      role: "VETERINARIAN",
    });

    expect(mockReviewRepository.findReviewsByVeterinarian).toHaveBeenCalledWith(
      "vet-1",
    );
    expect(result).toHaveLength(1);
  });

  it("DIRECTOR sans targetVeterinarianId reçoit les avis de sa clinique", async () => {
    mockClinicService.getClinicIdByUserId.mockResolvedValue("clinic-1");
    mockReviewRepository.findReviewsByClinic.mockResolvedValue([
      makeRawReview(),
    ]);

    const result = await reviewService.getReviewsByRole({
      userId: "director-1" as any,
      role: "DIRECTOR",
    });

    expect(mockClinicService.getClinicIdByUserId).toHaveBeenCalledWith({
      userId: "director-1",
      role: "DIRECTOR",
    });
    expect(mockReviewRepository.findReviewsByClinic).toHaveBeenCalledWith({
      clinicId: "clinic-1",
    });
    expect(result).toHaveLength(1);
  });

  it("REFERENT avec targetVeterinarianId reçoit les avis d'un véto précis, scopés à sa clinique", async () => {
    mockClinicService.getClinicIdByUserId.mockResolvedValue("clinic-1");
    mockReviewRepository.findReviewsByVeterinarian.mockResolvedValue([
      makeRawReview(),
    ]);

    const result = await reviewService.getReviewsByRole({
      userId: "referent-1" as any,
      role: "REFERENT",
      targetVeterinarianId: "vet-2" as any,
    });

    expect(mockReviewRepository.findReviewsByVeterinarian).toHaveBeenCalledWith(
      "vet-2",
      "clinic-1",
    );
    expect(result).toHaveLength(1);
  });

  it("lève ForbiddenError pour un rôle non géré", async () => {
    await expect(
      reviewService.getReviewsByRole({
        userId: "user-1" as any,
        role: "SECRETARY" as any,
      }),
    ).rejects.toThrow();
  });
});

// ── getByKeys ────────────────────────────────────────────────────────────────

describe("ReviewService.getByKeys", () => {
  it("retourne l'avis formaté si trouvé", async () => {
    mockReviewRepository.findKeys.mockResolvedValue(makeRawReview());

    const result = await reviewService.getByKeys({
      clientId: "client-1" as any,
      veterinarianClinicId: "vc-1" as any,
    });

    expect(mockReviewRepository.findKeys).toHaveBeenCalledWith({
      clientId: "client-1",
      veterinarianClinicId: "vc-1",
    });
    expect(result?.id).toBe("review-1");
  });

  it("retourne null si aucun avis trouvé (sans planter sur le format)", async () => {
    mockReviewRepository.findKeys.mockResolvedValue(null);

    const result = await reviewService.getByKeys({
      clientId: "client-1" as any,
      veterinarianClinicId: "vc-1" as any,
    });

    expect(result).toBeNull();
  });
});

// ── getStats ─────────────────────────────────────────────────────────────────

describe("ReviewService.getStats", () => {
  it("ADMIN sans veterinarianId reçoit les stats globales", async () => {
    mockReviewRepository.getGlobalStats.mockResolvedValue({
      average: 4.567,
      count: 12,
    });

    const result = await reviewService.getStats({
      userId: "admin-1" as any,
      role: "ADMIN",
    });

    expect(mockReviewRepository.getGlobalStats).toHaveBeenCalled();
    expect(result).toEqual({ average: 4.6, count: 12 });
  });

  it("ADMIN avec veterinarianId reçoit les stats d'un véto précis", async () => {
    mockClinicService.getClinicIdByUserId.mockResolvedValue("clinic-1");
    mockReviewRepository.getStatsByVeterinarian.mockResolvedValue({
      average: 3.0,
      count: 5,
    });

    const result = await reviewService.getStats({
      userId: "admin-1" as any,
      role: "ADMIN",
      veterinarianId: "vet-2" as any,
    });

    expect(mockReviewRepository.getStatsByVeterinarian).toHaveBeenCalledWith(
      "vet-2",
      "clinic-1",
    );
    expect(result).toEqual({ average: 3, count: 5 });
  });

  it("VETERINARIAN reçoit ses propres stats (PK partagée)", async () => {
    mockReviewRepository.getStatsByVeterinarian.mockResolvedValue({
      average: 4.0,
      count: 3,
    });

    const result = await reviewService.getStats({
      userId: "vet-1" as any,
      role: "VETERINARIAN",
    });

    expect(mockReviewRepository.getStatsByVeterinarian).toHaveBeenCalledWith(
      "vet-1",
    );
    expect(result).toEqual({ average: 4, count: 3 });
  });

  it("DIRECTOR reçoit les stats de sa clinique", async () => {
    mockClinicService.getClinicIdByUserId.mockResolvedValue("clinic-1");
    mockReviewRepository.getStatsByClinic.mockResolvedValue({
      average: 4.2,
      count: 8,
    });

    const result = await reviewService.getStats({
      userId: "director-1" as any,
      role: "DIRECTOR",
    });

    expect(mockReviewRepository.getStatsByClinic).toHaveBeenCalledWith(
      "clinic-1",
    );
    expect(result).toEqual({ average: 4.2, count: 8 });
  });

  it("CLIENT reçoit ses propres stats", async () => {
    mockReviewRepository.getStatsByClient.mockResolvedValue({
      average: 5.0,
      count: 1,
    });

    const result = await reviewService.getStats({
      userId: "client-1" as any,
      role: "CLIENT",
    });

    expect(mockReviewRepository.getStatsByClient).toHaveBeenCalledWith(
      "client-1",
    );
    expect(result).toEqual({ average: 5, count: 1 });
  });

  it("retourne {average: null, count: 0} pour un rôle non géré", async () => {
    const result = await reviewService.getStats({
      userId: "user-1" as any,
      role: "SECRETARY" as any,
    });

    expect(result).toEqual({ average: null, count: 0 });
  });

  it("average null (aucun avis) reste null après arrondi", async () => {
    mockReviewRepository.getGlobalStats.mockResolvedValue({
      average: null,
      count: 0,
    });

    const result = await reviewService.getStats({
      userId: "admin-1" as any,
      role: "ADMIN",
    });

    expect(result).toEqual({ average: null, count: 0 });
  });
});
