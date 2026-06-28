import { Router } from "express";
import type { Router as RouterType } from "express";
import { authMiddleware } from "@api/middlewares/auth.middleware";
import { roleMiddleware } from "@api/middlewares/role.middleware";
import { validate } from "@api/middlewares/validate.middleware";
import { updateClinicSchema } from "@armali/schemas";
import { ClinicController } from "./clinic.controller";

const clinicRouter: RouterType = Router();
const controller = new ClinicController();

clinicRouter.get(
  "/staff",
  authMiddleware,
  roleMiddleware(["DIRECTOR", "REFERANT", "VETERINARIAN", "SECRETARY"]),
  controller.getClinicStaff.bind(controller),
);

clinicRouter.get(
  "/me",
  authMiddleware,
  roleMiddleware(["DIRECTOR", "REFERANT", "VETERINARIAN", "SECRETARY"]),
  controller.getMyClinic.bind(controller),
);

clinicRouter.patch(
  "/me",
  authMiddleware,
  roleMiddleware(["DIRECTOR"]),
  validate(updateClinicSchema),
  controller.updateClinic.bind(controller),
);

export default clinicRouter;
