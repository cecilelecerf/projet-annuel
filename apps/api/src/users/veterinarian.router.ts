import { Router } from "express";
import type { RequestHandler, Router as RouterType } from "express";
import { authMiddleware, roleMiddleware } from "@api/middlewares";
import { STAFF_ROLES } from "@api/utils";
import { meetingController } from "@api/instances";

const veterinarianRouter: RouterType = Router();

veterinarianRouter.get(
  "/:id/availabilities/timeline",
  authMiddleware,
  roleMiddleware(STAFF_ROLES),
  meetingController.getAvailabilityTimeline.bind(
    meetingController,
  ) as RequestHandler,
);
export default veterinarianRouter;
