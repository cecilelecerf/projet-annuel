import { Router } from "express";
import type { RequestHandler } from "express";
import { authMiddleware, roleMiddleware } from "@api/middlewares";
import { STAFF_ROLES } from "@api/utils";
import { brandController } from "@api/instances";
import { requireApprovedClinic } from "@api/middlewares/clinic-guard.middleware";
import { UserRole } from "@armali/schemas";

const brandRouter: Router = Router();
const controller = brandController;

const CATALOG_MANAGER_ROLES: UserRole[] = ["ADMIN"] as const;
brandRouter.use(authMiddleware);
brandRouter.use(requireApprovedClinic);

// GET /brands?search=xxx — recherche ouverte à tout le staff (utile pour les demandes)
brandRouter.get(
  "/",
  roleMiddleware(STAFF_ROLES),
  controller.getAll.bind(controller) as RequestHandler,
);

brandRouter.get(
  "/:id",
  roleMiddleware(STAFF_ROLES),
  controller.getById.bind(controller) as RequestHandler,
);

brandRouter.post(
  "/",
  roleMiddleware(CATALOG_MANAGER_ROLES),

  controller.create.bind(controller) as RequestHandler,
);

brandRouter.patch(
  "/:id",
  roleMiddleware(CATALOG_MANAGER_ROLES),
  controller.update.bind(controller) as RequestHandler,
);

brandRouter.delete(
  "/:id",
  roleMiddleware(CATALOG_MANAGER_ROLES),
  controller.delete.bind(controller) as RequestHandler,
);

export default brandRouter;
