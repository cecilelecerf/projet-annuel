import { Router } from "express";
import type { Router as RouterType } from "express";
import { authMiddleware } from "@api/middlewares/auth.middleware";
import { roleMiddleware } from "@api/middlewares/role.middleware";
import { validate } from "@api/middlewares/validate.middleware";
import { ReviewController } from "@api/controllers/review.controller";
import { createReviewSchema } from "@armali/schemas";

const reviewRouter: RouterType = Router();
const controller = new ReviewController();

reviewRouter.get(
  "/vets",
  authMiddleware,
  roleMiddleware(["CLIENT"]),
  controller.listVeterinarians.bind(controller),
);

reviewRouter.post(
  "/",
  authMiddleware,
  roleMiddleware(["CLIENT"]),
  validate(createReviewSchema),
  controller.upsertReview.bind(controller),
);

reviewRouter.get(
  "/mine",
  authMiddleware,
  roleMiddleware(["CLIENT"]),
  controller.getMyReviews.bind(controller),
);

reviewRouter.get(
  "/vet/:vetId",
  authMiddleware,
  controller.getVetReviews.bind(controller),
);

export default reviewRouter;
