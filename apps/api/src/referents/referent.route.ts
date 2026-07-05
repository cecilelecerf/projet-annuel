import { Router } from "express";
import type { Router as RouterType } from "express";
import { authMiddleware } from "@api/middlewares/auth.middleware";
import { roleMiddleware } from "@api/middlewares/role.middleware";
import { validate } from "@api/middlewares/validate.middleware";
import { ReferentController } from "@api/referents/referent.controller";
import {
  createVeterinarianStaffSchema,
  createSecretaryStaffSchema,
  updateClinicReferentSchema,
} from "@armali/schemas";

const referentRouter: RouterType = Router();
const controller = new ReferentController();

referentRouter.get(
  "/staff",
  authMiddleware,
  roleMiddleware(["REFERANT"]),
  controller.getClinicStaff.bind(controller),
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

referentRouter.post(
  "/clinic/specialities/:specialityId",
  authMiddleware,
  roleMiddleware(["REFERANT"]),
  controller.linkSpeciality.bind(controller),
);

referentRouter.delete(
  "/clinic/specialities/:specialityId",
  authMiddleware,
  roleMiddleware(["REFERANT"]),
  controller.unlinkSpeciality.bind(controller),
);

referentRouter.delete(
  "/staff/:id",
  authMiddleware,
  roleMiddleware(["REFERANT"]),
  controller.deleteStaffMember.bind(controller),
);

referentRouter.get(
  "/analytics/visits-forecast",
  authMiddleware,
  roleMiddleware(["REFERANT"]),
  controller.getVisitsForecast.bind(controller),
);

export default referentRouter;
