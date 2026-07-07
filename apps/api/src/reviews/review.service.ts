import type {
  ClientId,
  CreateReview,
  ReviewId,
  UserId,
  UserRole,
  VeterinarianClinicId,
  VeterinarianId,
} from "@armali/schemas";
import {
  ReviewRepository,
  ReviewWithRelationsInclude,
} from "./review.repository";
import { ClinicService } from "@api/clinics/clinic.service";
import { match } from "ts-pattern";
import { ForbiddenError } from "@api/errors";

export class ReviewService {
  constructor(
    private repository: ReviewRepository,
    private clinicService: ClinicService,
  ) {}

  private formatMetaReview(review: ReviewWithRelationsInclude) {
    return {
      ...review,
      id: review.id as ReviewId,
      veterinarian: review.veterinarianClinic.veterinarian.user,
      client: review.client.user,
      clinic: review.veterinarianClinic.clinic,
    };
  }

  async upsertReview(clientId: string, data: CreateReview) {
    return this.repository.upsertReview({
      clientId,
      veterinarianClinicId: data.veterinarianClinicId,
      rating: data.rating,
      comment: data.comment ?? null,
    });
  }

  async getReviewsByRole({
    userId,
    role,
    targetVeterinarianId,
  }: {
    userId: UserId;
    role: UserRole;
    targetVeterinarianId?: VeterinarianId;
  }) {
    const reviews = await match(role)
      .with("ADMIN", async () => await this.repository.findAll())
      .with(
        "CLIENT",
        async () => await this.repository.findReviewsByClient(userId),
      )
      .with(
        "VETERINARIAN",
        async () => await this.repository.findReviewsByVeterinarian(userId),
      )
      .when(
        (r) => r === "DIRECTOR" || r === "REFERENT",
        async () => {
          const clinicId = await this.clinicService.getClinicIdByUserId({
            userId,
            role,
          });
          if (targetVeterinarianId) {
            return await this.repository.findReviewsByVeterinarian(
              targetVeterinarianId,
              clinicId,
            );
          }
          return await this.repository.findReviewsByClinic({ clinicId });
        },
      )
      .otherwise(() => {
        throw new ForbiddenError();
      });
    return reviews.map(this.formatMetaReview);
  }

  async getByKeys({
    clientId,
    veterinarianClinicId,
  }: {
    clientId: ClientId;
    veterinarianClinicId: VeterinarianClinicId;
  }) {
    const review = await this.repository.findKeys({
      clientId,
      veterinarianClinicId,
    });
    if (review) return this.formatMetaReview(review);
    return review;
  }

  async getStats({
    userId,
    role,
    veterinarianId,
  }: {
    userId: UserId;
    role: UserRole;
    veterinarianId?: VeterinarianId;
  }) {
    const roundAverage = (value: number | null) =>
      value !== null ? Math.round(value * 10) / 10 : null;

    const toResult = (stats: { average: number | null; count: number }) => ({
      average: roundAverage(stats.average),
      count: stats.count,
    });

    // ADMIN et REFERENT peuvent consulter les stats d'un vétérinaire précis
    if (veterinarianId && (role === "ADMIN" || role === "REFERENT")) {
      const clinicId = await this.clinicService.getClinicIdByUserId({
        userId,
        role,
      });
      console.log(
        toResult(
          await this.repository.getStatsByVeterinarian(
            veterinarianId,
            clinicId,
          ),
        ),
      );
      return toResult(
        await this.repository.getStatsByVeterinarian(veterinarianId, clinicId),
      );
    }

    switch (role) {
      case "ADMIN":
        return toResult(await this.repository.getGlobalStats());

      case "VETERINARIAN":
        // PK partagée : VeterinarianProfile.id === User.id
        return toResult(await this.repository.getStatsByVeterinarian(userId));

      case "DIRECTOR":
      case "REFERENT": {
        const clinicId = await this.clinicService.getClinicIdByUserId({
          userId,
          role: "REFERENT",
        });
        return toResult(await this.repository.getStatsByClinic(clinicId));
      }

      case "CLIENT":
        return toResult(await this.repository.getStatsByClient(userId));

      default:
        return { average: null, count: 0 };
    }
  }
}
