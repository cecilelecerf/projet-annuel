import { Router } from "express";
import type { RequestHandler } from "express";
import { authMiddleware, roleMiddleware } from "@api/middlewares";
import { STAFF_ROLES } from "@api/utils";
import { requireApprovedClinic } from "@api/middlewares/clinic-guard.middleware";
import { clinicActController } from "@api/instances";

const clinicActRouter: Router = Router();
const controller = clinicActController;

clinicActRouter.use(authMiddleware);
clinicActRouter.use(requireApprovedClinic);
// ── ClinicActs ────────────────────────────────────────────────────────────────

clinicActRouter.get(
  "/:id",
  roleMiddleware(STAFF_ROLES),
  controller.getClinicActById.bind(controller) as RequestHandler,
);

clinicActRouter.post(
  "/",
  roleMiddleware(["REFERENT", "DIRECTOR"]),
  controller.createClinicAct.bind(controller) as RequestHandler,
);

clinicActRouter.patch(
  "/:id",
  roleMiddleware(["REFERENT", "DIRECTOR"]),
  controller.updateClinicAct.bind(controller) as RequestHandler,
);

clinicActRouter.delete(
  "/:id",
  roleMiddleware(["REFERENT", "DIRECTOR"]),
  controller.deleteClinicAct.bind(controller) as RequestHandler,
);

export default clinicActRouter;
