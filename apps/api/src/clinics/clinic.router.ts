import { Router } from "express";
import type { RequestHandler, Router as RouterType } from "express";
import { authMiddleware } from "@api/middlewares/auth.middleware";
import { roleMiddleware } from "@api/middlewares/role.middleware";
import { validate } from "@api/middlewares/validate.middleware";
import {
  updateClinicPetsSchema,
  updateClinicSchema,
  updateClinicSpecialitiesSchema,
} from "@armali/schemas";
import {
  animalController,
  clinicController,
  clinicPetController,
  clinicSpecialityController,
} from "@api/instances";
import { CLINIC_STAFF_ROLES } from "@api/utils";
import { requireApprovedClinic } from "@api/middlewares/clinic-guard.middleware";
import clinicRequestRouter from "./clinic-requests/request.router";
import staffRouter from "./staffs/staff.router";
import clinicActRouter from "./clinic-acts/clinic-act.router";

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
  "/:id/animals",
  requireApprovedClinic,
  roleMiddleware(["SECRETARY"]),
  animalController.getByClinic.bind(animalController) as RequestHandler,
);

clinicRouter.get(
  "/:id/specialities",
  requireApprovedClinic,
  clinicSpecialityController.getAcceptedSpecialities.bind(
    clinicSpecialityController,
  ) as RequestHandler,
);

clinicRouter.patch(
  "/:id/specialities",
  requireApprovedClinic,
  roleMiddleware(["REFERENT", "DIRECTOR"]),
  validate(updateClinicSpecialitiesSchema),
  clinicSpecialityController.setAcceptedSpecialities.bind(
    clinicSpecialityController,
  ) as RequestHandler,
);

clinicRouter.get(
  "/:id/pets",
  requireApprovedClinic,
  roleMiddleware(["REFERENT", "DIRECTOR"]),
  clinicPetController.getAcceptedPets.bind(
    clinicPetController,
  ) as RequestHandler,
);

clinicRouter.patch(
  "/:id/pets",
  requireApprovedClinic,
  roleMiddleware(["REFERENT", "DIRECTOR"]),
  validate(updateClinicPetsSchema),
  clinicPetController.setAcceptedPets.bind(
    clinicPetController,
  ) as RequestHandler,
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
clinicRouter.use("/:clinicId/staffs", staffRouter);
clinicRouter.use("/:clinicId/acts", clinicActRouter);
export default clinicRouter;
