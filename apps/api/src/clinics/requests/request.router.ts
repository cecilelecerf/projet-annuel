import { Router } from "express";
import type { Router as RouterType } from "express";
import { authMiddleware } from "@api/middlewares/auth.middleware";
import { roleMiddleware } from "@api/middlewares/role.middleware";
import { validate } from "@api/middlewares/validate.middleware";
import { createClinicRequestSchema } from "@armali/schemas";
import { directorController } from "@api/instances";

const directorRouter: RouterType = Router();
const controller = directorController;

directorRouter.get(
  "/clinic",
  authMiddleware,
  roleMiddleware(["DIRECTOR"]),
  controller.getClinicStatus.bind(controller),
);

directorRouter.post(
  "/clinics/request",
  authMiddleware,
  roleMiddleware(["DIRECTOR"]),
  validate(createClinicRequestSchema),
  controller.requestClinic.bind(controller),
);

directorRouter.get(
  "/clinics/requests",
  authMiddleware,
  roleMiddleware(["DIRECTOR"]),
  controller.getMyRequests.bind(controller),
);

export default directorRouter;
