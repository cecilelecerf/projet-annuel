import { Router } from "express";
import type { RequestHandler, Router as RouterType } from "express";
import { authMiddleware } from "@api/middlewares/auth.middleware";
import { roleMiddleware } from "@api/middlewares/role.middleware";
import { validate } from "@api/middlewares/validate.middleware";
import { updateClinicSchema } from "@armali/schemas";
import {
  clinicController,
  medicalHistoryController,
  staffController,
} from "@api/instances";
import { CLINIC_STAFF_ROLES, STAFF_ROLES } from "@api/utils";
import { requireApprovedClinic } from "@api/middlewares/clinic-guard.middleware";

const clinicRouter: RouterType = Router();

clinicRouter.use(authMiddleware);
// clinicRouter.use(requireApprovedClinic);
const controller = clinicController;
clinicRouter.get(
  "/:id/medical-histories",
  requireApprovedClinic,
  medicalHistoryController.getByClinic.bind(
    medicalHistoryController,
  ) as RequestHandler,
);
clinicRouter.get(
  "/:id/staffs",
  requireApprovedClinic,
  roleMiddleware(CLINIC_STAFF_ROLES),
  staffController.getStaffByClinic.bind(staffController) as RequestHandler,
);
clinicRouter.get(
  "/:id/clients",
  requireApprovedClinic,
  roleMiddleware(CLINIC_STAFF_ROLES),
  controller.getClientsByClinic.bind(controller) as RequestHandler,
);

clinicRouter.get(
  "/me",
  roleMiddleware(STAFF_ROLES),
  controller.getMyClinic.bind(controller) as RequestHandler,
);

clinicRouter.patch(
  "/",
  requireApprovedClinic,
  roleMiddleware(["DIRECTOR", "REFERENT"]),
  validate(updateClinicSchema),
  controller.updateClinic.bind(controller) as RequestHandler,
);

export default clinicRouter;
