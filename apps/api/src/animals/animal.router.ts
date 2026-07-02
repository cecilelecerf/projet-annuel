import { Router } from "express";
import type { RequestHandler } from "express";
import { authMiddleware, roleMiddleware, validate } from "@api/middlewares";
import { createAnimalSchema, updateAnimalSchema } from "@armali/schemas";
import { animalController, animalMeetingController } from "@api/instances";

const animalRouter: Router = Router();
const controller = animalController;

animalRouter.get(
  "/",
  authMiddleware,
  controller.getAll.bind(controller) as RequestHandler,
);
animalRouter.get(
  "/user/:userId",
  authMiddleware,
  controller.getByUser.bind(controller) as RequestHandler,
);

animalRouter.get(
  "/:id",
  authMiddleware,
  controller.getById.bind(controller) as RequestHandler,
);
animalRouter.get(
  "/:id/vaccines",
  authMiddleware,
  controller.getVaccines.bind(controller) as RequestHandler,
);
animalRouter.get(
  "/:id/meetings",
  authMiddleware,
  roleMiddleware(["VETERINARIAN", "SECRETARY", "CLIENT"]),
  animalMeetingController.getByAnimal.bind(
    animalMeetingController,
  ) as RequestHandler,
);

animalRouter.post(
  "/",
  authMiddleware,
  validate(createAnimalSchema),
  controller.create.bind(controller) as RequestHandler,
);

animalRouter.patch(
  "/:id",
  authMiddleware,
  validate(updateAnimalSchema),
  controller.update.bind(controller) as RequestHandler,
);

animalRouter.delete(
  "/:id",
  authMiddleware,
  roleMiddleware(["CLIENT"]),
  controller.delete.bind(controller) as RequestHandler,
);

export default animalRouter;
