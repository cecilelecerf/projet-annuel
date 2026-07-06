import type { Request, Response, NextFunction } from "express";
import { ReviewService } from "./review.service";
import { RequestWithParams } from "@api/middlewares";
import { VeterinarianId } from "@armali/schemas";

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

  async upsertReview(req: Request, res: Response, next: NextFunction) {
    try {
      const review = await this.service.upsertReview(req.user!.id, req.body);
      res.status(200).json(review);
    } catch (err) {
      next(err);
    }
  }

  async getMyReviews(req: Request, res: Response, next: NextFunction) {
    try {
      const reviews = await this.service.getMyReviews(req.user!.id);
      res.status(200).json(reviews);
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
