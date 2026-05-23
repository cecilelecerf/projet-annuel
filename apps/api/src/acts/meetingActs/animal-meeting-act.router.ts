import { Router } from "express";
import type { RequestHandler } from "express";
import { authMiddleware, roleMiddleware } from "@api/middlewares";
import { AnimalMeetingActController } from "./animal-meeting-act.controller";
import { UserRole } from "@armali/schemas";

const animalMeetingActRouter: Router = Router();
const controller = new AnimalMeetingActController();

const allowedRoles: UserRole[] = [
  "VETERINARIAN",
  "SECRETARY",
  "DIRECTOR",
  "REFERANT",
  "ADMIN",
];

animalMeetingActRouter.get(
  "/:meetingId",
  authMiddleware,
  roleMiddleware(allowedRoles),
  controller.getByMeeting.bind(controller) as RequestHandler,
);

animalMeetingActRouter.get(
  "/:meetingId/:id",
  authMiddleware,
  roleMiddleware(allowedRoles),
  controller.getById.bind(controller) as RequestHandler,
);

animalMeetingActRouter.post(
  "/:meetingId",
  authMiddleware,
  roleMiddleware(["VETERINARIAN", "SECRETARY"]),
  controller.create.bind(controller) as RequestHandler,
);

animalMeetingActRouter.patch(
  "/:meetingId/:id",
  authMiddleware,
  roleMiddleware(["VETERINARIAN"]),
  controller.update.bind(controller) as RequestHandler,
);

animalMeetingActRouter.delete(
  "/:meetingId/:id",
  authMiddleware,
  roleMiddleware(["VETERINARIAN", "SECRETARY"]),
  controller.delete.bind(controller) as RequestHandler,
);

export default animalMeetingActRouter;
