import { authMiddleware, roleMiddleware, validate } from "@api/middlewares";
import { Router } from "express";
import type { RequestHandler, Router as RouterType } from "express";
import {
  createSpecialitySchema,
  updateSpecialitySchema,
} from "@armali/schemas";
import { specialityController } from "@api/instances";

const specialityRouter: RouterType = Router();
const controller = specialityController;
// GET /specialities
specialityRouter.get(
  "/",
  authMiddleware,
  controller.getAll.bind(controller) as RequestHandler,
);

// GET /specialities/:id
specialityRouter.get(
  "/:id",
  authMiddleware,
  controller.getById.bind(controller) as RequestHandler,
);

// POST /specialities
specialityRouter.post(
  "/",
  authMiddleware,
  roleMiddleware(["ADMIN"]),
  validate(createSpecialitySchema),
  controller.create.bind(controller) as RequestHandler,
);

// PATCH /specialities/:id
specialityRouter.patch(
  "/:id",
  authMiddleware,
  roleMiddleware(["ADMIN"]),
  validate(updateSpecialitySchema),
  controller.update.bind(controller) as RequestHandler,
);

// DELETE /specialities/:id
specialityRouter.delete(
  "/:id",
  authMiddleware,
  roleMiddleware(["ADMIN"]),
  controller.delete.bind(controller) as RequestHandler,
);

export default specialityRouter;
