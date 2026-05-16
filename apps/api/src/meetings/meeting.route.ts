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
} from "@armali/schemas";

const meetingRouter: RouterType = Router();

const meetingController = new MeetingController();
const availabilityController = new AvailabilityController();
const internalController = new InternalMeetingController();
const animalController = new AnimalMeetingController();

const staffRoles = [
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

// ── Disponibilités ────────────────────────────────────────────────────────────
meetingRouter.post(
  "/availabilities",
  authMiddleware,
  roleMiddleware([...staffRoles]),
  validate(createAvailabilitySchema),
  availabilityController.create.bind(availabilityController) as RequestHandler,
);
meetingRouter.patch(
  "/availabilities/:id",
  authMiddleware,
  roleMiddleware([...staffRoles]),
  validate(updateAvailabilitySchema),
  availabilityController.update.bind(availabilityController) as RequestHandler,
);
meetingRouter.delete(
  "/availabilities/:id",
  authMiddleware,
  roleMiddleware([...staffRoles]),
  availabilityController.delete.bind(availabilityController) as RequestHandler,
);

// ── Réunions internes ─────────────────────────────────────────────────────────
meetingRouter.post(
  "/internal",
  authMiddleware,
  roleMiddleware([...staffRoles]),
  validate(createInternalMeetingSchema),
  internalController.create.bind(internalController) as RequestHandler,
);
meetingRouter.patch(
  "/internal/:id",
  authMiddleware,
  roleMiddleware([...staffRoles]),
  internalController.update.bind(internalController) as RequestHandler,
);
meetingRouter.delete(
  "/internal/:id",
  authMiddleware,
  roleMiddleware([...staffRoles]),
  internalController.delete.bind(internalController) as RequestHandler,
);
meetingRouter.patch(
  "/internal/:id/participants/:userId",
  authMiddleware,
  roleMiddleware([...staffRoles]),
  internalController.updateParticipantStatus.bind(
    internalController,
  ) as RequestHandler,
);

// ── Rendez-vous animaux ───────────────────────────────────────────────────────
meetingRouter.post(
  "/animal",
  authMiddleware,
  roleMiddleware(["VETERINARIAN", "SECRETARY", "CLIENT"]),
  validate(createAnimalMeetingSchema),
  animalController.create.bind(animalController) as RequestHandler,
);
meetingRouter.get(
  "/animal/:id",
  authMiddleware,
  roleMiddleware(["VETERINARIAN", "SECRETARY", "CLIENT"]),
  animalController.getById.bind(animalController) as RequestHandler,
);
meetingRouter.patch(
  "/animal/:id",
  authMiddleware,
  roleMiddleware(["VETERINARIAN"]),
  validate(updateAnimalMeetingSchema),
  animalController.update.bind(animalController) as RequestHandler,
);
meetingRouter.delete(
  "/animal/:id",
  authMiddleware,
  roleMiddleware(["VETERINARIAN", "SECRETARY"]),
  animalController.delete.bind(animalController) as RequestHandler,
);

export default meetingRouter;
