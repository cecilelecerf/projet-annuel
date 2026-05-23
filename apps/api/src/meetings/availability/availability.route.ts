import { authMiddleware, roleMiddleware, validate } from "@api/middlewares";
import { Router } from "express";
import type { RequestHandler, Router as RouterType } from "express";
import { AvailabilityController } from "./availability.controller";
import {
  createAvailabilitySchema,
  updateAvailabilitySchema,
  UserRole,
} from "@armali/schemas";
import { STAFF_ROLES } from "@api/utils";

const availabilityRouter: RouterType = Router();

const availabilityController = new AvailabilityController();
availabilityRouter.post(
  "/",
  authMiddleware,
  roleMiddleware(STAFF_ROLES),
  validate(createAvailabilitySchema),
  availabilityController.create.bind(availabilityController) as RequestHandler,
);
availabilityRouter.patch(
  "/:id",
  authMiddleware,
  roleMiddleware(STAFF_ROLES),
  validate(updateAvailabilitySchema),
  availabilityController.update.bind(availabilityController) as RequestHandler,
);
availabilityRouter.delete(
  "/:id",
  authMiddleware,
  roleMiddleware(STAFF_ROLES),
  availabilityController.delete.bind(availabilityController) as RequestHandler,
);
export default availabilityRouter;
