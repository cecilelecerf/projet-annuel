import { Router } from "express";
import type { RequestHandler, Router as RouterType } from "express";
import { authMiddleware, roleMiddleware } from "@api/middlewares";
import { MeetingController } from "@api/meetings/meeting.controller";
import availabilityRouter from "./availability/availability.router";
import animalMeetingRouter from "./animal-meeting/animal-meeting.router";
import internalMeetingRouter from "./internal-meeting/internal-meeting.router";
import recurringMeetingRouter from "./recurring-meeting/recurring-meeting.router";

const meetingRouter: RouterType = Router();

const meetingController = new MeetingController();
// ── Calendrier ────────────────────────────────────────────────────────────────
meetingRouter.get(
  "/calendar",
  authMiddleware,
  roleMiddleware(["VETERINARIAN", "SECRETARY"]),
  meetingController.getMyCalendar.bind(meetingController) as RequestHandler,
);
meetingRouter.get(
  "/calendar/:veterinarianId",
  authMiddleware,
  roleMiddleware(["SECRETARY"]),
  meetingController.getVeterinarianCalendar.bind(
    meetingController,
  ) as RequestHandler,
);

meetingRouter.get(
  "/:id",
  authMiddleware,
  roleMiddleware(["SECRETARY", "VETERINARIAN", "CLIENT"]),
  meetingController.getMeeting.bind(meetingController) as RequestHandler,
);

meetingRouter.use("/recurrings", recurringMeetingRouter);
meetingRouter.use("/availabilities", availabilityRouter);
meetingRouter.use("/animals", animalMeetingRouter);
meetingRouter.use("/internal", internalMeetingRouter);

export default meetingRouter;
