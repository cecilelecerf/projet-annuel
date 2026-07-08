import { Router } from "express";
import type { RequestHandler } from "express";
import { authMiddleware, roleMiddleware } from "@api/middlewares";
import { orderController } from "@api/instances";

const orderRouter: Router = Router();
const controller = orderController;

orderRouter.post(
  "/checkout",
  authMiddleware,
  roleMiddleware(["CLIENT"]),
  controller.checkout.bind(controller) as RequestHandler,
);

orderRouter.get(
  "/mine",
  authMiddleware,
  roleMiddleware(["CLIENT"]),
  controller.getMyOrders.bind(controller) as RequestHandler,
);

orderRouter.get(
  "/:id",
  authMiddleware,
  roleMiddleware(["CLIENT"]),
  controller.getOrderById.bind(controller) as RequestHandler,
);

// ── Côté secrétaire ──────────────────────────────────────────────────────

orderRouter.get(
  "/clinic/pending",
  authMiddleware,
  roleMiddleware(["SECRETARY"]),
  controller.getClinicOrders.bind(controller) as RequestHandler,
);

orderRouter.patch(
  "/:id/ready",
  authMiddleware,
  roleMiddleware(["SECRETARY"]),
  controller.markReady.bind(controller) as RequestHandler,
);

orderRouter.post(
  "/deliver",
  authMiddleware,
  roleMiddleware(["SECRETARY"]),
  controller.deliver.bind(controller) as RequestHandler,
);

export default orderRouter;