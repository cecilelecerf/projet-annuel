import { Router } from "express";
import type { RequestHandler } from "express";
import { authMiddleware, roleMiddleware } from "@api/middlewares";
import { STAFF_ROLES } from "@api/utils";
import { brandController } from "@api/instances";

const brandRouter: Router = Router();
const controller = brandController;

const STOCK_MANAGER_ROLES = ["ADMIN", "DIRECTOR", "REFERENT"] as const;

brandRouter.get(
  "/",
  authMiddleware,
  roleMiddleware(STAFF_ROLES),
  controller.getAll.bind(controller) as RequestHandler,
);

brandRouter.get(
  "/:id",
  authMiddleware,
  roleMiddleware(STAFF_ROLES),
  controller.getById.bind(controller) as RequestHandler,
);

brandRouter.post(
  "/",
  authMiddleware,
  roleMiddleware([...STOCK_MANAGER_ROLES]),
  controller.create.bind(controller) as RequestHandler,
);

brandRouter.patch(
  "/:id",
  authMiddleware,
  roleMiddleware([...STOCK_MANAGER_ROLES]),
  controller.update.bind(controller) as RequestHandler,
);

brandRouter.delete(
  "/:id",
  authMiddleware,
  roleMiddleware([...STOCK_MANAGER_ROLES]),
  controller.delete.bind(controller) as RequestHandler,
);

export default brandRouter;