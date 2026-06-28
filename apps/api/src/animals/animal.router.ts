import { Router } from "express";
import type { RequestHandler } from "express";
import { authMiddleware, roleMiddleware, validate } from "@api/middlewares";
import { AnimalController } from "./animal.controller";
import { createAnimalSchema, updateAnimalSchema } from "@armali/schemas";

const animalRouter: Router = Router();
const controller = new AnimalController();

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
