import { Router } from "express";
import type { RequestHandler } from "express";
import { authMiddleware, roleMiddleware } from "@api/middlewares";
import { ActController } from "./act.controller";

const actRouter: Router = Router();
const controller = new ActController();

const allStaff = [
  "ADMIN",
  "DIRECTOR",
  "SECRETARY",
  "REFERANT",
  "VETERINARIAN",
] as const;

// ── Acts (catalogue global) ───────────────────────────────────────────────────

actRouter.get(
  "/",
  authMiddleware,
  roleMiddleware([...allStaff]),
  controller.getAll.bind(controller) as RequestHandler,
);

actRouter.get(
  "/:id",
  authMiddleware,
  roleMiddleware([...allStaff]),
  controller.getById.bind(controller) as RequestHandler,
);

actRouter.post(
  "/",
  authMiddleware,
  roleMiddleware(["ADMIN"]),
  controller.create.bind(controller) as RequestHandler,
);

actRouter.patch(
  "/:id",
  authMiddleware,
  roleMiddleware(["ADMIN"]),
  controller.update.bind(controller) as RequestHandler,
);

actRouter.delete(
  "/:id",
  authMiddleware,
  roleMiddleware(["ADMIN"]),
  controller.delete.bind(controller) as RequestHandler,
);
// actRouter.get(
//   "/meeting/:meetingId",
//   authMiddleware,
//   roleMiddleware([...allStaff]),
//   controller.getByMeeting.bind(controller) as RequestHandler,
// );
// ── ClinicActs ────────────────────────────────────────────────────────────────

actRouter.get(
  "/clinic/:clinicId",
  authMiddleware,
  roleMiddleware([...allStaff]),
  controller.getClinicActs.bind(controller) as RequestHandler,
);

actRouter.get(
  "/clinic-act/:id",
  authMiddleware,
  roleMiddleware([...allStaff]),
  controller.getClinicActById.bind(controller) as RequestHandler,
);

actRouter.post(
  "/clinic",
  authMiddleware,
  roleMiddleware(["ADMIN", "DIRECTOR"]),
  controller.createClinicAct.bind(controller) as RequestHandler,
);

actRouter.patch(
  "/clinic-act/:id",
  authMiddleware,
  roleMiddleware(["ADMIN", "DIRECTOR"]),
  controller.updateClinicAct.bind(controller) as RequestHandler,
);

actRouter.delete(
  "/clinic-act/:id",
  authMiddleware,
  roleMiddleware(["ADMIN", "DIRECTOR"]),
  controller.deleteClinicAct.bind(controller) as RequestHandler,
);

export default actRouter;
