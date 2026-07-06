import { describe, it, expect, vi, beforeEach } from "vitest";

const mockReviewRepository = vi.hoisted(() => ({
  findAllVeterinariansWithReviews: vi.fn(),
  upsertReview: vi.fn(),
  findReviewsByClient: vi.fn(),
  findReviewsByVeterinarian: vi.fn(),
}));

vi.mock("@api/reviews/review.repository", () => ({
  ReviewRepository: vi.fn(function () {
    return mockReviewRepository;
  }),
}));

const { ReviewRepository } = await import("@api/reviews/review.repository");
const { ReviewService } = await import("@api/reviews/review.service");

const reviewService = new ReviewService(new ReviewRepository({} as any));

beforeEach(() => vi.clearAllMocks());

// ── listVeterinarians ─────────────────────────────────────────────────────────

describe("ReviewService.listVeterinarians", () => {
  it("calcule correctement la moyenne des notes", async () => {
    mockReviewRepository.findAllVeterinariansWithReviews.mockResolvedValue([
      {
        id: "vet-1",
        bio: "Vétérinaire généraliste",
        user: { id: "user-1", firstname: "Alice", lastname: "Dupont" },
        reviews: [{ rating: 4 }, { rating: 5 }, { rating: 3 }],
        veterinarianClinics: [{ clinic: { name: "Clinique A" } }],
      },
    ]);

    const result = await reviewService.listVeterinarians();

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: "vet-1",
      firstname: "Alice",
      lastname: "Dupont",
      bio: "Vétérinaire généraliste",
      clinics: ["Clinique A"],
      averageRating: 4, // (4+5+3)/3 = 4
      reviewCount: 3,
    });
  });

  it("arrondit la moyenne à une décimale", async () => {
    mockReviewRepository.findAllVeterinariansWithReviews.mockResolvedValue([
      {
        id: "vet-1",
        bio: null,
        user: { id: "user-1", firstname: "Alice", lastname: "Dupont" },
        reviews: [{ rating: 5 }, { rating: 4 }, { rating: 4 }],
        veterinarianClinics: [],
      },
    ]);

    const result = await reviewService.listVeterinarians();

    // (5+4+4)/3 = 4.333... → arrondi à 4.3
    expect(result[0].averageRating).toBe(4.3);
  });

  it("retourne averageRating null si aucun avis", async () => {
    mockReviewRepository.findAllVeterinariansWithReviews.mockResolvedValue([
      {
        id: "vet-1",
        bio: null,
        user: { id: "user-1", firstname: "Alice", lastname: "Dupont" },
        reviews: [],
        veterinarianClinics: [],
      },
    ]);

    const result = await reviewService.listVeterinarians();

    expect(result[0].averageRating).toBeNull();
    expect(result[0].reviewCount).toBe(0);
  });

  it("liste plusieurs cliniques pour un même véto", async () => {
    mockReviewRepository.findAllVeterinariansWithReviews.mockResolvedValue([
      {
        id: "vet-1",
        bio: null,
        user: { id: "user-1", firstname: "Alice", lastname: "Dupont" },
        reviews: [],
        veterinarianClinics: [
          { clinic: { name: "Clinique A" } },
          { clinic: { name: "Clinique B" } },
        ],
      },
    ]);

    const result = await reviewService.listVeterinarians();

    expect(result[0].clinics).toEqual(["Clinique A", "Clinique B"]);
  });
});

// ── upsertReview ──────────────────────────────────────────────────────────────

describe("ReviewService.upsertReview", () => {
  it("transmet les bons paramètres au repository", async () => {
    mockReviewRepository.upsertReview.mockResolvedValue({
      id: "review-1",
      clientId: "client-1",
      veterinarianId: "vet-1",
      rating: 5,
      comment: "Excellent",
    });

    const result = await reviewService.upsertReview("client-1", {
      veterinarianId: "vet-1",
      rating: 5,
      comment: "Excellent",
    } as any);

    expect(mockReviewRepository.upsertReview).toHaveBeenCalledWith({
      clientId: "client-1",
      veterinarianId: "vet-1",
      rating: 5,
      comment: "Excellent",
    });
    expect(result.id).toBe("review-1");
  });

  it("transforme comment undefined en null", async () => {
    mockReviewRepository.upsertReview.mockResolvedValue({});

    await reviewService.upsertReview("client-1", {
      veterinarianId: "vet-1",
      rating: 3,
    } as any);

    expect(mockReviewRepository.upsertReview).toHaveBeenCalledWith({
      clientId: "client-1",
      veterinarianId: "vet-1",
      rating: 3,
      comment: null,
    });
  });
});

// ── getMyReviews ──────────────────────────────────────────────────────────────

describe("ReviewService.getMyReviews", () => {
  it("délègue au repository avec le bon clientId", async () => {
    mockReviewRepository.findReviewsByClient.mockResolvedValue([
      { id: "review-1" },
    ]);

    const result = await reviewService.getMyReviews("client-1");

    expect(mockReviewRepository.findReviewsByClient).toHaveBeenCalledWith(
      "client-1",
    );
    expect(result).toHaveLength(1);
  });
});

// ── getVetReviews ─────────────────────────────────────────────────────────────

describe("ReviewService.getVetReviews", () => {
  it("délègue au repository avec le bon veterinarianId", async () => {
    mockReviewRepository.findReviewsByVeterinarian.mockResolvedValue([
      { id: "review-1" },
    ]);

    const result = await reviewService.getVetReviews("vet-1");

    expect(mockReviewRepository.findReviewsByVeterinarian).toHaveBeenCalledWith(
      "vet-1",
    );
    expect(result).toHaveLength(1);
  });
});
