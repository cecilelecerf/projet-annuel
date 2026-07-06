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
import { STAFF_ROLES } from "@api/utils";
import { staffController } from "@api/instances";

const staffRouter: RouterType = Router();

const controller = staffController;

staffRouter.post(
  "/veterinarian",
  authMiddleware,
  roleMiddleware(["DIRECTOR", "REFERENT"]),
  validate(createVeterinarianStaffSchema),
  controller.createVeterinarian.bind(controller) as RequestHandler,
);

staffRouter.post(
  "/secretary",
  authMiddleware,
  roleMiddleware(["REFERENT", "DIRECTOR"]),
  validate(createSecretaryStaffSchema),
  controller.createSecretary.bind(controller) as RequestHandler,
);

staffRouter.post(
  "/referent",
  authMiddleware,
  roleMiddleware(["DIRECTOR"]),
  validate(createReferentStaffSchema),
  controller.createReferent.bind(controller) as RequestHandler,
);
staffRouter.get(
  "/:id",
  authMiddleware,
  roleMiddleware(["REFERENT", "DIRECTOR"]),
  controller.getStaffMemberDetail.bind(controller) as RequestHandler,
);

export default staffRouter;
