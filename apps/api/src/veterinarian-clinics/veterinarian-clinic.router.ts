import { Router } from "express";
import type { RequestHandler, Router as RouterType } from "express";
import { authMiddleware } from "@api/middlewares/auth.middleware";
import { reviewController, staffController } from "@api/instances";
import { requireApprovedClinic } from "@api/middlewares/clinic-guard.middleware";
import { roleMiddleware } from "@api/middlewares";

const veterinarianClinicRouter: RouterType = Router();

veterinarianClinicRouter.use(authMiddleware);
veterinarianClinicRouter.use(requireApprovedClinic);

const controller = staffController;
veterinarianClinicRouter.get(
  `/:id/review/me`,
  roleMiddleware(["CLIENT"]),
  reviewController.getMyVetReview.bind(reviewController) as RequestHandler,
);

veterinarianClinicRouter.get(
  `/:id/review`,
  roleMiddleware(["DIRECTOR", "REFERENT"]),
  reviewController.getReviews.bind(reviewController) as RequestHandler,
);

export default veterinarianClinicRouter;
