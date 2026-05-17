import { authMiddleware, roleMiddleware, validate } from "@api/middlewares";
import { Router } from "express";
import type { RequestHandler, Router as RouterType } from "express";
import {
  createAnimalMeetingSchema,
  updateAnimalMeetingSchema,
} from "@armali/schemas";
import { AnimalMeetingController } from "./animal-meeting.controller";

const animalMeetingRouter: RouterType = Router();

const animalController = new AnimalMeetingController();
animalMeetingRouter.post(
  "/",
  authMiddleware,
  roleMiddleware(["VETERINARIAN", "SECRETARY", "CLIENT"]),
  validate(createAnimalMeetingSchema),
  animalController.create.bind(animalController) as RequestHandler,
);
animalMeetingRouter.get(
  "/:id",
  authMiddleware,
  roleMiddleware(["VETERINARIAN", "SECRETARY", "CLIENT"]),
  animalController.getById.bind(animalController) as RequestHandler,
);
animalMeetingRouter.patch(
  "/:id",
  authMiddleware,
  roleMiddleware(["VETERINARIAN"]),
  validate(updateAnimalMeetingSchema),
  animalController.update.bind(animalController) as RequestHandler,
);
animalMeetingRouter.delete(
  "/:id",
  authMiddleware,
  roleMiddleware(["VETERINARIAN", "SECRETARY"]),
  animalController.delete.bind(animalController) as RequestHandler,
);
export default animalMeetingRouter;
