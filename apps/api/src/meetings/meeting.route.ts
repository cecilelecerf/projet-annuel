import { Router } from "express";
import type { RequestHandler, Router as RouterType } from "express";
import { authMiddleware, roleMiddleware, validate } from "@api/middlewares";
import { MeetingController } from "@api/meetings/meeting.controller";
import { AvailabilityController } from "@api/meetings/availability/availability.controller";
import { InternalMeetingController } from "@api/meetings/internal-meeting/internal-meeting.controller";
import { AnimalMeetingController } from "@api/meetings/animal-meeting/animal-meeting.controller";
import {
  createAnimalMeetingSchema,
  createAvailabilitySchema,
  createInternalMeetingSchema,
  updateAnimalMeetingSchema,
  updateAvailabilitySchema,
  UserRole,
} from "@armali/schemas";
import availabilityRouter from "./availability/availability.route";
import animalMeetingRouter from "./animal-meeting/animal-meeting.router";
import internalMeetingRouter from "./internal-meeting/internal-meeting.router";

const meetingRouter: RouterType = Router();

const meetingController = new MeetingController();
const availabilityController = new AvailabilityController();
const internalController = new InternalMeetingController();
const animalController = new AnimalMeetingController();

export const staffRoles: UserRole[] = [
  "VETERINARIAN",
  "SECRETARY",
  "REFERANT",
  "DIRECTOR",
] as const;

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
meetingRouter.use("/availabilities", availabilityRouter);
meetingRouter.use("/animal", animalMeetingRouter);
meetingRouter.use("/internal", internalMeetingRouter);

export default meetingRouter;
