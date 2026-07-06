import { Router } from "express";
import type { RequestHandler, Router as RouterType } from "express";
import { authMiddleware } from "@api/middlewares/auth.middleware";
import { roleMiddleware } from "@api/middlewares/role.middleware";
import { validate } from "@api/middlewares/validate.middleware";
import { createReviewSchema } from "@armali/schemas";
import { reviewController } from "@api/instances";
import { requireApprovedClinic } from "@api/middlewares/clinic-guard.middleware";

const reviewRouter: RouterType = Router();
const controller = reviewController;

reviewRouter.use(authMiddleware);
reviewRouter.use(requireApprovedClinic);
reviewRouter.get(
  "/vets",
  roleMiddleware(["CLIENT"]),
  controller.listVeterinarians.bind(controller),
);

reviewRouter.post(
  "/",
  roleMiddleware(["CLIENT"]),
  validate(createReviewSchema),
  controller.upsertReview.bind(controller),
);

reviewRouter.get(
  "/mine",
  roleMiddleware(["CLIENT"]),
  controller.getMyReviews.bind(controller),
);

export default reviewRouter;
