import type { Request, Response, NextFunction } from "express";
import { ReviewService } from "./review.service";
import { AuthenticatedRequest, RequestWithParams } from "@api/middlewares";
import {
  ReviewMeta,
  reviewMetaSchema,
  reviewSchema,
  VeterinarianClinicId,
  VeterinarianId,
} from "@armali/schemas";

export class ReviewController {
  constructor(private service: ReviewService) {}

  async listVeterinarians(req: Request, res: Response, next: NextFunction) {
    try {
      const vets = await this.service.listVeterinarians();
      res.status(200).json(vets);
    } catch (err) {
      next(err);
    }
  }

  async upsertReview(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const review = await this.service.upsertReview(req.user.id, req.body);
      res.status(200).json(review);
    } catch (err) {
      next(err);
    }
  }

  async getReviews(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const reviews = await this.service.getReviewsByRole({
        userId: req.user.id,
        role: req.user.role,
      });
      const parse = reviews?.map((review) => ({
        ...review,
        id: review.id,
        veterinarian: review.veterinarianClinic.veterinarian.user,
        client: review.client.user,
        clinic: review.veterinarianClinic.clinic,
      }));
      res.status(200).json(reviewMetaSchema.array().parse(parse));
    } catch (err) {
      next(err);
    }
  }
  async getMyVetReview(
    req: RequestWithParams<{ id: VeterinarianClinicId }>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const review = await this.service.getByKeys({
        clientId: req.user.id,
        veterinarianClinicId: req.params.id,
      });
      res.status(200).json(reviewSchema.nullable().parse(review));
    } catch (err) {
      next(err);
    }
  }
  async getVetReviews(
    req: RequestWithParams<{ id: VeterinarianId }>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const reviews = await this.service.getVetReviews(req.params.id);
      res.status(200).json(reviews);
    } catch (err) {
      next(err);
    }
  }
}
