import { Router } from "express";
import type { Router as RouterType } from "express";
import { authMiddleware } from "@api/middlewares/auth.middleware";
import { roleMiddleware } from "@api/middlewares/role.middleware";
import { validate } from "@api/middlewares/validate.middleware";
import { DirectorController } from "@api/directors/director.controller";
import {
  createReferentStaffSchema,
  createVeterinarianStaffSchema,
  createSecretaryStaffSchema,
  createClinicRequestSchema,
  linkVeterinarianStaffSchema,
} from "@armali/schemas";

const directorRouter: RouterType = Router();
const controller = new DirectorController();

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
  "/staff/veterinarians/search",
  authMiddleware,
  roleMiddleware(["DIRECTOR"]),
  controller.searchVeterinarian.bind(controller),
);

directorRouter.post(
  "/staff/veterinarians/link",
  authMiddleware,
  roleMiddleware(["DIRECTOR"]),
  validate(linkVeterinarianStaffSchema),
  controller.linkVeterinarian.bind(controller),
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

directorRouter.post(
  "/clinic/specialities/:specialityId",
  authMiddleware,
  roleMiddleware(["DIRECTOR"]),
  controller.linkSpeciality.bind(controller),
);

directorRouter.delete(
  "/clinic/specialities/:specialityId",
  authMiddleware,
  roleMiddleware(["DIRECTOR"]),
  controller.unlinkSpeciality.bind(controller),
);

directorRouter.delete(
  "/staff/:id",
  authMiddleware,
  roleMiddleware(["DIRECTOR"]),
  controller.deleteStaffMember.bind(controller),
);

directorRouter.get(
  "/analytics/overview",
  authMiddleware,
  roleMiddleware(["DIRECTOR"]),
  controller.getAnalyticsOverview.bind(controller),
);

export default directorRouter;
