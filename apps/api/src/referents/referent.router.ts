import { Router } from "express";
import type { Router as RouterType, RequestHandler } from "express";
import { authMiddleware } from "@api/middlewares/auth.middleware";
import { roleMiddleware } from "@api/middlewares/role.middleware";
import { validate } from "@api/middlewares/validate.middleware";
import { ReferentController } from "@api/referents/referent.controller";
import {
  createVeterinarianStaffSchema,
  createSecretaryStaffSchema,
  updateClinicReferentSchema,
  updateClinicSpecialitiesSchema,
} from "@armali/schemas";
import { referentController } from "@api/instances";

const referentRouter: RouterType = Router();
const controller = referentController;

referentRouter.get(
  "/dashboard",
  authMiddleware,
  roleMiddleware(["REFERENT"]),
  controller.getDashboard.bind(controller),
);

referentRouter.get(
  "/staff",
  authMiddleware,
  roleMiddleware(["REFERENT"]),
  controller.getClinicStaff.bind(controller),
);

referentRouter.get(
  "/staff/:id",
  authMiddleware,
  roleMiddleware(["REFERENT"]),
  controller.getStaffMemberDetail.bind(controller) as RequestHandler,
);

referentRouter.post(
  "/staff/veterinarians",
  authMiddleware,
  roleMiddleware(["REFERENT"]),
  validate(createVeterinarianStaffSchema),
  controller.createVeterinarian.bind(controller),
);

referentRouter.post(
  "/staff/secretaries",
  authMiddleware,
  roleMiddleware(["REFERENT"]),
  validate(createSecretaryStaffSchema),
  controller.createSecretary.bind(controller),
);

referentRouter.patch(
  "/clinic",
  authMiddleware,
  roleMiddleware(["REFERENT"]),
  validate(updateClinicReferentSchema),
  controller.updateClinic.bind(controller),
);

referentRouter.get(
  "/clinic/specialities",
  authMiddleware,
  roleMiddleware(["REFERENT"]),
  controller.getClinicSpecialities.bind(controller),
);

referentRouter.patch(
  "/clinic/specialities",
  authMiddleware,
  roleMiddleware(["REFERENT"]),
  validate(updateClinicSpecialitiesSchema),
  controller.updateClinicSpecialities.bind(controller),
);

export default referentRouter;