import { Router } from "express";
import type { Router as RouterType } from "express";
import { authMiddleware } from "@api/middlewares/auth.middleware";
import { roleMiddleware } from "@api/middlewares/role.middleware";
import { validate } from "@api/middlewares/validate.middleware";
import { createClinicRequestSchema } from "@armali/schemas";
import { ClinicRequestController } from "./request.controller";

const clinicRequestRouter: RouterType = Router();
const controller = new ClinicRequestController();

clinicRequestRouter.get(
  "/clinic",
  authMiddleware,
  roleMiddleware(["DIRECTOR"]),
  controller.getClinicStatus.bind(controller),
);

clinicRequestRouter.post(
  "/clinics/request",
  authMiddleware,
  roleMiddleware(["DIRECTOR"]),
  validate(createClinicRequestSchema),
  controller.requestClinic.bind(controller),
);

clinicRequestRouter.get(
  "/clinics/requests",
  authMiddleware,
  roleMiddleware(["DIRECTOR"]),
  controller.getMyRequests.bind(controller),
);

export default clinicRequestRouter;
