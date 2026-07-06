import { Router } from "express";
import type { RequestHandler } from "express";
import { authMiddleware, roleMiddleware } from "@api/middlewares";
import { STAFF_ROLES } from "@api/utils";
import { actController } from "@api/instances";
import { requireApprovedClinic } from "@api/middlewares/clinic-guard.middleware";

const actRouter: Router = Router();
const controller = actController;

actRouter.use(authMiddleware);
actRouter.use(requireApprovedClinic);
// ── Acts (catalogue global) ───────────────────────────────────────────────────

actRouter.get(
  "/",
  roleMiddleware(STAFF_ROLES),
  controller.getAll.bind(controller) as RequestHandler,
);

actRouter.get(
  "/:id",
  roleMiddleware(STAFF_ROLES),
  controller.getById.bind(controller) as RequestHandler,
);

actRouter.post(
  "/",
  roleMiddleware(["ADMIN"]),
  controller.create.bind(controller) as RequestHandler,
);

actRouter.patch(
  "/:id",
  roleMiddleware(["ADMIN"]),
  controller.update.bind(controller) as RequestHandler,
);

actRouter.delete(
  "/:id",
  roleMiddleware(["ADMIN"]),
  controller.delete.bind(controller) as RequestHandler,
);
// ── ClinicActs ────────────────────────────────────────────────────────────────

actRouter.get(
  "/clinic-acts/:clinicId",
  roleMiddleware(STAFF_ROLES),
  controller.getClinicActs.bind(controller) as RequestHandler,
);

actRouter.get(
  "/clinic-acts/:id",
  roleMiddleware(STAFF_ROLES),
  controller.getClinicActById.bind(controller) as RequestHandler,
);

actRouter.post(
  "/clinic-acts",
  roleMiddleware(["ADMIN", "DIRECTOR"]),
  controller.createClinicAct.bind(controller) as RequestHandler,
);

actRouter.patch(
  "/clinic-acts/:id",
  roleMiddleware(["ADMIN", "DIRECTOR"]),
  controller.updateClinicAct.bind(controller) as RequestHandler,
);

actRouter.delete(
  "/clinic-acts/:id",
  roleMiddleware(["ADMIN", "DIRECTOR"]),
  controller.deleteClinicAct.bind(controller) as RequestHandler,
);

export default actRouter;
