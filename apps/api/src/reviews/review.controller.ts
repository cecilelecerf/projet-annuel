import type { Response, NextFunction } from "express";
import { ReviewService } from "./review.service";
import { AuthenticatedRequest, RequestWithParams } from "@api/middlewares";
import {
  reviewMetaSchema,
  reviewStatSchema,
  VeterinarianClinicId,
  VeterinarianId,
} from "@armali/schemas";

export class ReviewController {
  constructor(private service: ReviewService) {}

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
    req: RequestWithParams<{ id?: VeterinarianId }>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const reviews = await this.service.getReviewsByRole({
        userId: req.user.id,
        role: req.user.role,
        targetVeterinarianId: req.params.id,
      });

      res.status(200).json(reviewMetaSchema.array().parse(reviews));
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
      res.status(200).json(reviewMetaSchema.nullable().parse(review));
    } catch (err) {
      next(err);
    }
  }

  async getStats(
    req: RequestWithParams<{ id?: VeterinarianId }>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const stats = await this.service.getStats({
        userId: req.user.id,
        role: req.user.role,
        veterinarianId: req.params.id,
      });
      res.status(200).json(reviewStatSchema.parse(stats));
    } catch (err) {
      next(err);
    }
  }
}
