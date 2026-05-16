import { Router } from "express";
import type { RequestHandler, Router as RouterType } from "express";
import { authMiddleware } from "@api/middlewares/auth.middleware";
import { roleMiddleware } from "@api/middlewares/role.middleware";
import { MeetingController } from "@api/meetings/meeting.controller";

const meetingRouter: RouterType = Router();
const controller = new MeetingController();

meetingRouter.get(
  "/",
  authMiddleware,
  roleMiddleware(["VETERINARIAN", "SECRETARY"]),
  controller.getMyCalendar.bind(controller) as RequestHandler,
);
meetingRouter.get(
  "/:veterinarianId",
  authMiddleware,
  roleMiddleware(["SECRETARY"]),
  controller.getVeterinarianCalendar.bind(controller) as RequestHandler,
);

export default meetingRouter;
