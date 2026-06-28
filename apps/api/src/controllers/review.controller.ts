import { ReviewService } from "@api/services/review.service";
import type { Request, Response, NextFunction } from "express";

const reviewService = new ReviewService();

export class ReviewController {
  async listVeterinarians(req: Request, res: Response, next: NextFunction) {
    try {
      const vets = await reviewService.listVeterinarians();
      res.status(200).json(vets);
    } catch (err) {
      next(err);
    }
  }

  async upsertReview(req: Request, res: Response, next: NextFunction) {
    try {
      const review = await reviewService.upsertReview(req.user!.id, req.body);
      res.status(200).json(review);
    } catch (err) {
      next(err);
    }
  }

  async getMyReviews(req: Request, res: Response, next: NextFunction) {
    try {
      const reviews = await reviewService.getMyReviews(req.user!.id);
      res.status(200).json(reviews);
    } catch (err) {
      next(err);
    }
  }

  async getVetReviews(req: Request, res: Response, next: NextFunction) {
    try {
      const reviews = await reviewService.getVetReviews(req.params.vetId);
      res.status(200).json(reviews);
    } catch (err) {
      next(err);
    }
  }
}
