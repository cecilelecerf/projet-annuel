import { Router } from "express";
import type { RequestHandler } from "express";
import { authMiddleware, roleMiddleware, validate } from "@api/middlewares";
import { OwnedPetController } from "./owned-pet.controller";
import { createOwnedPetSchema, updateOwnedPetSchema } from "@armali/schemas";

const ownedPetRouter: Router = Router();
const controller = new OwnedPetController();

ownedPetRouter.get(
  "/",
  authMiddleware,
  controller.getAll.bind(controller) as RequestHandler,
);
ownedPetRouter.get(
  "/user/:userId",
  authMiddleware,
  controller.getByUser.bind(controller) as RequestHandler,
);

ownedPetRouter.get(
  "/:id",
  authMiddleware,
  controller.getById.bind(controller) as RequestHandler,
);

ownedPetRouter.post(
  "/",
  authMiddleware,
  validate(createOwnedPetSchema),
  controller.create.bind(controller) as RequestHandler,
);

ownedPetRouter.patch(
  "/:id",
  authMiddleware,
  validate(updateOwnedPetSchema),
  controller.update.bind(controller) as RequestHandler,
);

ownedPetRouter.delete(
  "/:id",
  authMiddleware,
  controller.delete.bind(controller) as RequestHandler,
);

export default ownedPetRouter;
