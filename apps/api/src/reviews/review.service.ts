import type { CreateReview } from "@armali/schemas";
import { ReviewRepository } from "./review.repository";

export class ReviewService {
  constructor(private repository: ReviewRepository) {}

  async listVeterinarians() {
    const vets = await this.repository.findAllVeterinariansWithReviews();

    return vets.map((v) => {
      const avg =
        v.reviews.length > 0
          ? v.reviews.reduce((sum, r) => sum + r.rating, 0) / v.reviews.length
          : null;
      return {
        id: v.id,
        firstname: v.user.firstname,
        lastname: v.user.lastname,
        bio: v.bio,
        clinics: v.veterinarianClinics.map((vc) => vc.clinic.name),
        averageRating: avg ? Math.round(avg * 10) / 10 : null,
        reviewCount: v.reviews.length,
      };
    });
  }

  async upsertReview(clientId: string, data: CreateReview) {
    return this.repository.upsertReview({
      clientId,
      veterinarianId: data.veterinarianId,
      rating: data.rating,
      comment: data.comment ?? null,
    });
  }

  async getMyReviews(clientId: string) {
    return this.repository.findReviewsByClient(clientId);
  }

  async getVetReviews(veterinarianId: string) {
    return this.repository.findReviewsByVeterinarian(veterinarianId);
  }
}
