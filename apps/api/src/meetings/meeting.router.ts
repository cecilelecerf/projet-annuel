import { Router } from "express";
import type { RequestHandler, Router as RouterType } from "express";
import { authMiddleware, roleMiddleware } from "@api/middlewares";
import availabilityRouter from "./availabilities/availability.router";
import animalMeetingRouter from "./animal-meeting/animal-meeting.router";
import internalMeetingRouter from "./internal-meeting/internal-meeting.router";
import recurringMeetingRouter from "./recurring-meeting/recurring-meeting.router";
import { meetingController } from "@api/instances";
import { STAFF_ROLES } from "@api/utils";
import { requireApprovedClinic } from "@api/middlewares/clinic-guard.middleware";

const meetingRouter: RouterType = Router();
meetingRouter.use(authMiddleware);
meetingRouter.use(requireApprovedClinic);
// ── Calendrier ────────────────────────────────────────────────────────────────
meetingRouter.get(
  "/calendar",
  roleMiddleware(STAFF_ROLES),
  meetingController.getMyCalendar.bind(meetingController) as RequestHandler,
);
meetingRouter.get(
  "/veterinarians/:veterinarianId/slots",
  roleMiddleware(["CLIENT"]),
  meetingController.getVetSlots.bind(meetingController) as RequestHandler,
);
meetingRouter.get(
  "/calendar/:veterinarianId",
  roleMiddleware(["SECRETARY"]),
  meetingController.getVeterinarianCalendar.bind(
    meetingController,
  ) as RequestHandler,
);

meetingRouter.use("/recurrings", recurringMeetingRouter);
meetingRouter.use("/availabilities", availabilityRouter);
meetingRouter.use("/animals", animalMeetingRouter);
meetingRouter.use("/internal", internalMeetingRouter);
meetingRouter.get(
  "/:id",
  roleMiddleware([...STAFF_ROLES, "CLIENT"]),
  meetingController.getMeeting.bind(meetingController) as RequestHandler,
);

export default meetingRouter;
