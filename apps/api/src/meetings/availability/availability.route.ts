import { authMiddleware, roleMiddleware, validate } from "@api/middlewares";
import { Router } from "express";
import type { RequestHandler, Router as RouterType } from "express";
import { AvailabilityController } from "./availability.controller";
import {
  createAvailabilitySchema,
  updateAvailabilitySchema,
  UserRole,
} from "@armali/schemas";

const availabilityRouter: RouterType = Router();
export const staffRoles: UserRole[] = [
  "VETERINARIAN",
  "SECRETARY",
  "REFERANT",
  "DIRECTOR",
] as const;
const availabilityController = new AvailabilityController();
availabilityRouter.post(
  "/",
  authMiddleware,
  roleMiddleware(staffRoles),
  validate(createAvailabilitySchema),
  availabilityController.create.bind(availabilityController) as RequestHandler,
);
availabilityRouter.patch(
  "/:id",
  authMiddleware,
  roleMiddleware([...staffRoles]),
  validate(updateAvailabilitySchema),
  availabilityController.update.bind(availabilityController) as RequestHandler,
);
availabilityRouter.delete(
  "/:id",
  authMiddleware,
  roleMiddleware([...staffRoles]),
  availabilityController.delete.bind(availabilityController) as RequestHandler,
);
export default availabilityRouter;
