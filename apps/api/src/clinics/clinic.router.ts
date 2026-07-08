import { Router } from "express";
import type { RequestHandler, Router as RouterType } from "express";
import { authMiddleware } from "@api/middlewares/auth.middleware";
import { roleMiddleware } from "@api/middlewares/role.middleware";
import { validate } from "@api/middlewares/validate.middleware";
import {
  updateClinicSchema,
  updateClinicSpecialitiesSchema,
} from "@armali/schemas";
import {
  clinicActController,
  clinicController,
  specialityController,
  staffController,
} from "@api/instances";
import { CLINIC_STAFF_ROLES } from "@api/utils";
import { requireApprovedClinic } from "@api/middlewares/clinic-guard.middleware";
import clinicRequestRouter from "./requests/request.router";

const clinicRouter: RouterType = Router();
const controller = clinicController;

clinicRouter.use(authMiddleware);

clinicRouter.use("/requests", clinicRequestRouter);

clinicRouter.get(
  "/",
  requireApprovedClinic,
  roleMiddleware(["ADMIN"]),
  controller.getAllClinics.bind(controller) as RequestHandler,
);

clinicRouter.get(
  "/me",
  roleMiddleware(CLINIC_STAFF_ROLES),
  controller.getMyClinic.bind(controller) as RequestHandler,
);
clinicRouter.get(
  "/:id/clinic-acts",
  requireApprovedClinic,
  roleMiddleware(CLINIC_STAFF_ROLES),
  clinicActController.getClinicActs.bind(clinicActController) as RequestHandler,
);

clinicRouter.get(
  "/:id/specialities",
  requireApprovedClinic,
  specialityController.getAllByClinic.bind(
    specialityController,
  ) as RequestHandler,
);

clinicRouter.patch(
  "/:id/specialities",
  requireApprovedClinic,
  roleMiddleware(["REFERENT", "DIRECTOR"]),
  validate(updateClinicSpecialitiesSchema),
  specialityController.linkWithClinic.bind(
    specialityController,
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

clinicRouter.patch(
  "/",
  requireApprovedClinic,
  roleMiddleware(["DIRECTOR", "REFERENT"]),
  validate(updateClinicSchema),
  controller.updateClinic.bind(controller) as RequestHandler,
);

clinicRouter.delete(
  "/:id",
  requireApprovedClinic,
  roleMiddleware(["ADMIN", "DIRECTOR"]),
  controller.deleteClinic.bind(controller) as RequestHandler,
);

export default clinicRouter;
