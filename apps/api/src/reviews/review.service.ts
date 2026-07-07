import type {
  ClientId,
  CreateReview,
  UserId,
  UserRole,
  VeterinarianClinicId,
} from "@armali/schemas";
import { ReviewRepository } from "./review.repository";
import { UserRepository } from "@api/users/user.repository";
import { VeterinarianClinicService } from "@api/veterinarian-clinics/veterinarian-clinic.service";
import { Review } from "../../prisma/generated/prisma/client";
import { UserService } from "@api/users/user.service";

export class ReviewService {
  constructor(
    private repository: ReviewRepository,
    private userService: UserService,
    private veterinarianClinicService: VeterinarianClinicService,
  ) {}

  async listVeterinarians() {
    const vets = await this.repository.findAllVeterinariansWithReviews();
    return vets.map((v) => {
      const reviewsLength = v.veterinarianClinics.reduce(
        (acc, vc) => {
          if (vc.reviews.length !== 0) return acc;
          acc.div += vc.reviews.length;
          acc.sum = vc.reviews.reduce((sum, r) => sum + r.rating, 0);
          return acc;
        },
        { sum: 0, div: 0 },
      );

      return {
        id: v.id,
        firstname: v.user.firstname,
        lastname: v.user.lastname,
        bio: v.bio,
        clinics: v.veterinarianClinics.map((vc) => vc.clinic.name),
        averageRating:
          reviewsLength.div !== 0
            ? Math.round((reviewsLength.sum / reviewsLength.div) * 10) / 10
            : null,
        reviewCount: reviewsLength.div,
      };
    });
  }

  async upsertReview(clientId: string, data: CreateReview) {
    return this.repository.upsertReview({
      clientId,
      veterinarianClinicId: data.veterinarianClinicId,
      rating: data.rating,
      comment: data.comment ?? null,
    });
  }

  async getReviewsByRole({ userId, role }: { userId: UserId; role: UserRole }) {
    if (role === "ADMIN") return this.repository.findAll();
    if (role === "CLIENT") return this.repository.findReviewsByClient(userId);
    return [];
    // TODO m'occupere les autres rôles
  }

  async getByKeys({
    clientId,
    veterinarianClinicId,
  }: {
    clientId: ClientId;
    veterinarianClinicId: VeterinarianClinicId;
  }) {
    return this.repository.findKeys({ clientId, veterinarianClinicId });
  }

  async getVetReviews(veterinarianId: string) {
    return this.repository.findReviewsByVeterinarian(veterinarianId);
  }
}
