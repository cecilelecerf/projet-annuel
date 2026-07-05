import { Router } from "express";
import type { RequestHandler, Router as RouterType } from "express";
import { authMiddleware } from "@api/middlewares/auth.middleware";
import { roleMiddleware } from "@api/middlewares/role.middleware";
import { validate } from "@api/middlewares/validate.middleware";
import { updateClinicSchema } from "@armali/schemas";
import { clinicController, medicalHistoryController } from "@api/instances";
import { STAFF_ROLES } from "@api/utils";

const clinicRouter: RouterType = Router();

const controller = clinicController;

clinicRouter.get(
  "/:id/medical-histories",
  authMiddleware,
  medicalHistoryController.getByClinic.bind(
    medicalHistoryController,
  ) as RequestHandler,
);
clinicRouter.get(
  "/staff",
  authMiddleware,
  roleMiddleware(STAFF_ROLES),
  controller.getStaffByClinic.bind(controller),
);

clinicRouter.get(
  "/me",
  authMiddleware,
  roleMiddleware(STAFF_ROLES),
  controller.getMyClinic.bind(controller) as RequestHandler,
);

clinicRouter.patch(
  "/me",
  authMiddleware,
  roleMiddleware(["DIRECTOR"]),
  validate(updateClinicSchema),
  controller.updateClinic.bind(controller),
);

export default clinicRouter;
