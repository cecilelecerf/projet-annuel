import { authMiddleware, roleMiddleware, validate } from "@api/middlewares";
import { Router } from "express";
import type { RequestHandler, Router as RouterType } from "express";
import {
  createAvailabilitySchema,
  updateAvailabilitySchema,
} from "@armali/schemas";
import { CLINIC_STAFF_ROLES } from "@api/utils";
import { availabilityController } from "@api/instances";

const availabilityRouter: RouterType = Router();

availabilityRouter.get(
  "/",
  authMiddleware,
  roleMiddleware(CLINIC_STAFF_ROLES),
  availabilityController.getAllByUser.bind(
    availabilityController,
  ) as RequestHandler,
);
availabilityRouter.post(
  "/",
  authMiddleware,
  roleMiddleware(CLINIC_STAFF_ROLES),
  validate(createAvailabilitySchema),
  availabilityController.create.bind(availabilityController) as RequestHandler,
);
availabilityRouter.patch(
  "/:id",
  authMiddleware,
  roleMiddleware(CLINIC_STAFF_ROLES),
  validate(updateAvailabilitySchema),
  availabilityController.update.bind(availabilityController) as RequestHandler,
);
availabilityRouter.delete(
  "/:id",
  authMiddleware,
  roleMiddleware(CLINIC_STAFF_ROLES),
  availabilityController.delete.bind(availabilityController) as RequestHandler,
);
export default availabilityRouter;
