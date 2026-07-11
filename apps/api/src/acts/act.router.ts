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
  roleMiddleware([
    "ADMIN",
    "REFERENT",
    "DIRECTOR",
    "CLIENT",
    "VETERINARIAN",
    "SECRETARY",
  ]),
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

export default actRouter;
