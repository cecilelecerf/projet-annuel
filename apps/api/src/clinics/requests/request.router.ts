import { Router } from "express";
import type { RequestHandler, Router as RouterType } from "express";
import { authMiddleware } from "@api/middlewares/auth.middleware";
import { roleMiddleware } from "@api/middlewares/role.middleware";
import { validate } from "@api/middlewares/validate.middleware";
import { createClinicRequestSchema } from "@armali/schemas";
import { clinicRequestController } from "@api/instances";

const clinicRequestRouter: RouterType = Router();
const controller = clinicRequestController;
clinicRequestRouter.use(authMiddleware);

clinicRequestRouter.get(
  "/status",
  roleMiddleware(["DIRECTOR"]),
  controller.getClinicStatus.bind(controller) as RequestHandler,
);

clinicRequestRouter.post(
  "/",
  roleMiddleware(["DIRECTOR"]),
  validate(createClinicRequestSchema),
  controller.requestClinic.bind(controller),
);

clinicRequestRouter.get(
  "/",
  roleMiddleware(["DIRECTOR", "ADMIN"]),
  controller.getRequests.bind(controller) as RequestHandler,
);
clinicRequestRouter.get(
  "/:id/approve",
  roleMiddleware(["ADMIN"]),
  controller.approveClinicRequest.bind(controller) as RequestHandler,
);

clinicRequestRouter.get(
  "/:id/reject",
  roleMiddleware(["ADMIN"]),
  controller.rejectClinicRequest.bind(controller) as RequestHandler,
);
export default clinicRequestRouter;
