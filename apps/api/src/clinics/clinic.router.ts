import { Router } from "express";
import type { RequestHandler, Router as RouterType } from "express";
import { authMiddleware } from "@api/middlewares/auth.middleware";
import { roleMiddleware } from "@api/middlewares/role.middleware";
import { validate } from "@api/middlewares/validate.middleware";
import { updateClinicSchema } from "@armali/schemas";
import { clinicController, medicalHistoryController } from "@api/instances";

const clinicRouter: RouterType = Router();

const controller = clinicController;

clinicRouter.get(
  "/:id/acts",
  authMiddleware,
  medicalHistoryController.getByClinic.bind(
    medicalHistoryController,
  ) as RequestHandler,
);
clinicRouter.get(
  "/staff",
  authMiddleware,
  roleMiddleware(["DIRECTOR", "REFERANT", "VETERINARIAN", "SECRETARY"]),
  controller.getClinicStaff.bind(controller),
);

clinicRouter.get(
  "/me",
  authMiddleware,
  roleMiddleware(["DIRECTOR", "REFERANT", "VETERINARIAN", "SECRETARY"]),
  controller.getMyClinic.bind(controller),
);

clinicRouter.patch(
  "/me",
  authMiddleware,
  roleMiddleware(["DIRECTOR"]),
  validate(updateClinicSchema),
  controller.updateClinic.bind(controller),
);

export default clinicRouter;
