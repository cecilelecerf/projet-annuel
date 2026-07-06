import { Router } from "express";
import type { Router as RouterType } from "express";
import { authMiddleware } from "@api/middlewares/auth.middleware";
import { roleMiddleware } from "@api/middlewares/role.middleware";
import { validate } from "@api/middlewares/validate.middleware";
import {
  createReferentStaffSchema,
  createVeterinarianStaffSchema,
  createSecretaryStaffSchema,
  createClinicRequestSchema,
} from "@armali/schemas";
import { directorController } from "@api/instances";

const directorRouter: RouterType = Router();
const controller = directorController;

directorRouter.post(
  "/staff/referents",
  authMiddleware,
  roleMiddleware(["DIRECTOR"]),
  validate(createReferentStaffSchema),
  controller.createReferent.bind(controller),
);

directorRouter.post(
  "/staff/veterinarians",
  authMiddleware,
  roleMiddleware(["DIRECTOR"]),
  validate(createVeterinarianStaffSchema),
  controller.createVeterinarian.bind(controller),
);

directorRouter.post(
  "/staff/secretaries",
  authMiddleware,
  roleMiddleware(["DIRECTOR"]),
  validate(createSecretaryStaffSchema),
  controller.createSecretary.bind(controller),
);

directorRouter.get(
  "/staff",
  authMiddleware,
  roleMiddleware(["DIRECTOR"]),
  controller.getClinicStaff.bind(controller),
);

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
