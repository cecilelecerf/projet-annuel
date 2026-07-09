import { Router } from "express";
import type { RequestHandler } from "express";
import { authMiddleware, roleMiddleware } from "@api/middlewares";
import { supplierOrderController } from "@api/instances";

const supplierOrderRouter: Router = Router();
const controller = supplierOrderController;

const SUPPLIER_ORDER_MANAGER_ROLES = ["REFERENT", "DIRECTOR"] as const;

supplierOrderRouter.use(
  authMiddleware,
  roleMiddleware([...SUPPLIER_ORDER_MANAGER_ROLES]),
);

supplierOrderRouter.get("/", controller.getAll.bind(controller) as RequestHandler);
supplierOrderRouter.get(
  "/:id",
  controller.getById.bind(controller) as RequestHandler,
);
supplierOrderRouter.post("/", controller.create.bind(controller) as RequestHandler);
supplierOrderRouter.patch(
  "/:id/receive",
  controller.markReceived.bind(controller) as RequestHandler,
);
supplierOrderRouter.patch(
  "/:id/cancel",
  controller.cancel.bind(controller) as RequestHandler,
);

export default supplierOrderRouter;