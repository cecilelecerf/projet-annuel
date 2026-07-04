import { Router } from "express";
import type { RequestHandler } from "express";
import { authMiddleware, roleMiddleware } from "@api/middlewares";
import { STAFF_ROLES } from "@api/utils";
import { specialityController } from "@api/instances";

const specialityRouter: Router = Router();
const controller = specialityController;

const MANAGER_ROLES = ["ADMIN", "DIRECTOR", "REFERENT"] as const;

specialityRouter.get(
  "/",
  authMiddleware,
  roleMiddleware(STAFF_ROLES),
  controller.getAll.bind(controller) as RequestHandler,
);

specialityRouter.get(
  "/:id",
  authMiddleware,
  roleMiddleware(STAFF_ROLES),
  controller.getById.bind(controller) as RequestHandler,
);

specialityRouter.post(
  "/",
  authMiddleware,
  roleMiddleware([...MANAGER_ROLES]),
  controller.create.bind(controller) as RequestHandler,
);

specialityRouter.patch(
  "/:id",
  authMiddleware,
  roleMiddleware([...MANAGER_ROLES]),
  controller.update.bind(controller) as RequestHandler,
);

specialityRouter.delete(
  "/:id",
  authMiddleware,
  roleMiddleware([...MANAGER_ROLES]),
  controller.delete.bind(controller) as RequestHandler,
);

export default specialityRouter;