import { Router } from "express";
import type { RequestHandler } from "express";
import { authMiddleware, roleMiddleware } from "@api/middlewares";
import { STAFF_ROLES } from "@api/utils";
import { productController } from "@api/instances";

const productRouter: Router = Router();
const controller = productController;

const STOCK_MANAGER_ROLES = ["ADMIN", "DIRECTOR", "REFERENT"] as const;

// ── Products (catalogue global) ─────────────────────────────────────────────

productRouter.get(
  "/",
  authMiddleware,
  roleMiddleware(STAFF_ROLES),
  controller.getAll.bind(controller) as RequestHandler,
);

productRouter.get(
  "/:id",
  authMiddleware,
  roleMiddleware(STAFF_ROLES),
  controller.getById.bind(controller) as RequestHandler,
);

productRouter.post(
  "/",
  authMiddleware,
  roleMiddleware([...STOCK_MANAGER_ROLES]),
  controller.create.bind(controller) as RequestHandler,
);

productRouter.patch(
  "/:id",
  authMiddleware,
  roleMiddleware([...STOCK_MANAGER_ROLES]),
  controller.update.bind(controller) as RequestHandler,
);

productRouter.delete(
  "/:id",
  authMiddleware,
  roleMiddleware([...STOCK_MANAGER_ROLES]),
  controller.delete.bind(controller) as RequestHandler,
);

// ── ClinicProducts (stock par clinique) ──────────────────────────────────────

productRouter.get(
  "/clinic-products/:clinicId",
  authMiddleware,
  roleMiddleware(STAFF_ROLES),
  controller.getClinicProducts.bind(controller) as RequestHandler,
);

productRouter.get(
  "/clinic-products/detail/:id",
  authMiddleware,
  roleMiddleware(STAFF_ROLES),
  controller.getClinicProductById.bind(controller) as RequestHandler,
);

productRouter.post(
  "/clinic-products",
  authMiddleware,
  roleMiddleware([...STOCK_MANAGER_ROLES]),
  controller.createClinicProduct.bind(controller) as RequestHandler,
);

productRouter.patch(
  "/clinic-products/:id",
  authMiddleware,
  roleMiddleware([...STOCK_MANAGER_ROLES]),
  controller.updateClinicProduct.bind(controller) as RequestHandler,
);

productRouter.patch(
  "/clinic-products/:id/restock",
  authMiddleware,
  roleMiddleware([...STOCK_MANAGER_ROLES]),
  controller.restockClinicProduct.bind(controller) as RequestHandler,
);

productRouter.delete(
  "/clinic-products/:id",
  authMiddleware,
  roleMiddleware([...STOCK_MANAGER_ROLES]),
  controller.deleteClinicProduct.bind(controller) as RequestHandler,
);

export default productRouter;