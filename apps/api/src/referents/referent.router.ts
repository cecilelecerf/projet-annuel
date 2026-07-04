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
  "/staff",
  authMiddleware,
  roleMiddleware(["REFERANT"]),
  controller.getClinicStaff.bind(controller),
);

referentRouter.get(
  "/staff/:id",
  authMiddleware,
  roleMiddleware(["REFERANT"]),
  controller.getStaffMemberDetail.bind(controller) as RequestHandler,
);

referentRouter.post(
  "/staff/veterinarians",
  authMiddleware,
  roleMiddleware(["REFERANT"]),
  validate(createVeterinarianStaffSchema),
  controller.createVeterinarian.bind(controller),
);

referentRouter.post(
  "/staff/secretaries",
  authMiddleware,
  roleMiddleware(["REFERANT"]),
  validate(createSecretaryStaffSchema),
  controller.createSecretary.bind(controller),
);

referentRouter.patch(
  "/clinic",
  authMiddleware,
  roleMiddleware(["REFERANT"]),
  validate(updateClinicReferentSchema),
  controller.updateClinic.bind(controller),
);

referentRouter.get(
  "/clinic/specialities",
  authMiddleware,
  roleMiddleware(["REFERANT"]),
  controller.getClinicSpecialities.bind(controller),
);

referentRouter.patch(
  "/clinic/specialities",
  authMiddleware,
  roleMiddleware(["REFERANT"]),
  validate(updateClinicSpecialitiesSchema),
  controller.updateClinicSpecialities.bind(controller),
);

export default referentRouter;