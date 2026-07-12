import { Router } from "express";
import type { RequestHandler } from "express";
import { authMiddleware, roleMiddleware } from "@api/middlewares";
import { supplierController } from "@api/instances";

const supplierRouter: Router = Router();
const controller = supplierController;

const READ_ROLES = ["ADMIN", "REFERENT", "DIRECTOR"] as const;
const MANAGER_ROLES = ["ADMIN"] as const;

supplierRouter.use(authMiddleware);

// ── Lecture : admin, référent, directeur ────────────────────────────────────
supplierRouter.get(
  "/",
  roleMiddleware([...READ_ROLES]),
  controller.getAll.bind(controller) as RequestHandler,
);
supplierRouter.get(
  "/:id",
  roleMiddleware([...READ_ROLES]),
  controller.getById.bind(controller) as RequestHandler,
);

// ── Écriture : admin uniquement (catalogue global, comme Product) ──────────
supplierRouter.post(
  "/",
  roleMiddleware([...MANAGER_ROLES]),
  controller.create.bind(controller) as RequestHandler,
);
supplierRouter.patch(
  "/:id",
  roleMiddleware([...MANAGER_ROLES]),
  controller.update.bind(controller) as RequestHandler,
);
supplierRouter.delete(
  "/:id",
  roleMiddleware([...MANAGER_ROLES]),
  controller.delete.bind(controller) as RequestHandler,
);

supplierRouter.post(
  "/:id/products",
  roleMiddleware([...MANAGER_ROLES]),
  controller.addProduct.bind(controller) as RequestHandler,
);
supplierRouter.patch(
  "/:id/products/:productLinkId",
  roleMiddleware([...MANAGER_ROLES]),
  controller.updateProduct.bind(controller) as RequestHandler,
);
supplierRouter.delete(
  "/:id/products/:productLinkId",
  roleMiddleware([...MANAGER_ROLES]),
  controller.removeProduct.bind(controller) as RequestHandler,
);

export default supplierRouter;
