import { Router } from "express";
import type { RequestHandler } from "express";
import { authMiddleware, roleMiddleware } from "@api/middlewares";
import { STAFF_ROLES } from "@api/utils";
import { productController } from "@api/instances";
import { requireApprovedClinic } from "@api/middlewares/clinic-guard.middleware";

const productRouter: Router = Router();
const controller = productController;

const STOCK_MANAGER_ROLES = ["ADMIN", "DIRECTOR", "REFERENT"] as const;

productRouter.use(authMiddleware);
productRouter.use(requireApprovedClinic);
// ── Products (catalogue global) ─────────────────────────────────────────────

productRouter.get(
  "/",
  roleMiddleware(STAFF_ROLES),
  controller.getAll.bind(controller) as RequestHandler,
);

productRouter.get(
  "/:id",
  roleMiddleware(STAFF_ROLES),
  controller.getById.bind(controller) as RequestHandler,
);

productRouter.post(
  "/",
  roleMiddleware([...STOCK_MANAGER_ROLES]),
  controller.create.bind(controller) as RequestHandler,
);

productRouter.patch(
  "/:id",
  roleMiddleware([...STOCK_MANAGER_ROLES]),
  controller.update.bind(controller) as RequestHandler,
);

productRouter.delete(
  "/:id",
  roleMiddleware([...STOCK_MANAGER_ROLES]),
  controller.delete.bind(controller) as RequestHandler,
);

// ── ClinicProducts (stock par clinique) ──────────────────────────────────────

productRouter.get(
  "/clinic-products/:clinicId",
  roleMiddleware(STAFF_ROLES),
  controller.getClinicProducts.bind(controller) as RequestHandler,
);

productRouter.get(
  "/clinic-products/detail/:id",
  roleMiddleware(STAFF_ROLES),
  controller.getClinicProductById.bind(controller) as RequestHandler,
);

productRouter.post(
  "/clinic-products",
  roleMiddleware([...STOCK_MANAGER_ROLES]),
  controller.createClinicProduct.bind(controller) as RequestHandler,
);

productRouter.patch(
  "/clinic-products/:id",
  roleMiddleware([...STOCK_MANAGER_ROLES]),
  controller.updateClinicProduct.bind(controller) as RequestHandler,
);

productRouter.patch(
  "/clinic-products/:id/restock",
  roleMiddleware([...STOCK_MANAGER_ROLES]),
  controller.restockClinicProduct.bind(controller) as RequestHandler,
);

productRouter.delete(
  "/clinic-products/:id",
  roleMiddleware([...STOCK_MANAGER_ROLES]),
  controller.deleteClinicProduct.bind(controller) as RequestHandler,
);

export default productRouter;
