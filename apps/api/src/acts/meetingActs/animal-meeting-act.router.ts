import { Router } from "express";
import type { RequestHandler } from "express";
import { authMiddleware, roleMiddleware } from "@api/middlewares";
import { AnimalMeetingActController } from "./animal-meeting-act.controller";

const animalMeetingActRouter: Router = Router();
const controller = new AnimalMeetingActController();

const allowedRoles = [
  "VETERINARIAN",
  "SECRETARY",
  "DIRECTOR",
  "REFERANT",
  "ADMIN",
] as const;

animalMeetingActRouter.get(
  "/meeting/:meetingId",
  authMiddleware,
  roleMiddleware([...allowedRoles]),
  controller.getByMeeting.bind(controller) as RequestHandler,
);

animalMeetingActRouter.get(
  "/:id",
  authMiddleware,
  roleMiddleware([...allowedRoles]),
  controller.getById.bind(controller) as RequestHandler,
);

animalMeetingActRouter.post(
  "/",
  authMiddleware,
  roleMiddleware(["VETERINARIAN", "SECRETARY"]),
  controller.create.bind(controller) as RequestHandler,
);

animalMeetingActRouter.patch(
  "/:id",
  authMiddleware,
  roleMiddleware(["VETERINARIAN"]),
  controller.update.bind(controller) as RequestHandler,
);

animalMeetingActRouter.delete(
  "/:id",
  authMiddleware,
  roleMiddleware(["VETERINARIAN", "SECRETARY"]),
  controller.delete.bind(controller) as RequestHandler,
);

export default animalMeetingActRouter;
