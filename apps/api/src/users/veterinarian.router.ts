import { Router } from "express";
import type { RequestHandler, Router as RouterType } from "express";
import { authMiddleware, roleMiddleware } from "@api/middlewares";
import { STAFF_ROLES } from "@api/utils";
import { meetingController, reviewController } from "@api/instances";
import { requireApprovedClinic } from "@api/middlewares/clinic-guard.middleware";

const veterinarianRouter: RouterType = Router();

veterinarianRouter.use(authMiddleware);
veterinarianRouter.use(requireApprovedClinic);

veterinarianRouter.get(
  "/:id/availabilities/timeline",
  roleMiddleware(STAFF_ROLES),
  meetingController.getAvailabilityTimeline.bind(
    meetingController,
  ) as RequestHandler,
);

veterinarianRouter.get(
  "/:id/reviews/stats",
  roleMiddleware(["REFERENT", "DIRECTOR"]),
  reviewController.getStats.bind(reviewController) as RequestHandler,
);

export default veterinarianRouter;
