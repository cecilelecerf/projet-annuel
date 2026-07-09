import { Router } from "express";
import type { RequestHandler, Router as RouterType } from "express";
import { authMiddleware } from "@api/middlewares/auth.middleware";
import { roleMiddleware } from "@api/middlewares/role.middleware";
import { validate } from "@api/middlewares/validate.middleware";
import {
  createReferentStaffSchema,
  createSecretaryStaffSchema,
  createVeterinarianStaffSchema,
} from "@armali/schemas";
import { staffController } from "@api/instances";
import { requireApprovedClinic } from "@api/middlewares/clinic-guard.middleware";
import { CLINIC_STAFF_ROLES } from "@api/utils";

const staffRouter: RouterType = Router({ mergeParams: true });

staffRouter.use(authMiddleware);
staffRouter.use(requireApprovedClinic);
const controller = staffController;

staffRouter.get(
  "/",
  requireApprovedClinic,
  roleMiddleware(CLINIC_STAFF_ROLES),
  staffController.getStaffByClinic.bind(staffController) as RequestHandler,
);

staffRouter.post(
  "/veterinarian",
  roleMiddleware(["DIRECTOR", "REFERENT"]),
  validate(createVeterinarianStaffSchema),
  controller.createVeterinarian.bind(controller) as RequestHandler,
);

staffRouter.post(
  "/secretary",
  roleMiddleware(["REFERENT", "DIRECTOR"]),
  validate(createSecretaryStaffSchema),
  controller.createSecretary.bind(controller) as RequestHandler,
);

staffRouter.post(
  "/referent",
  roleMiddleware(["DIRECTOR"]),
  validate(createReferentStaffSchema),
  controller.createReferent.bind(controller) as RequestHandler,
);
staffRouter.get(
  "/:id",
  roleMiddleware(["REFERENT", "DIRECTOR"]),
  controller.getStaffMemberDetail.bind(controller) as RequestHandler,
);

export default staffRouter;
