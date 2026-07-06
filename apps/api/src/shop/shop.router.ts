import { Router } from "express";
import type { RequestHandler } from "express";
import { authMiddleware, roleMiddleware } from "@api/middlewares";
import { clientShopController } from "@api/instances";

const clientShopRouter: Router = Router();
const controller = clientShopController;

clientShopRouter.get(
  "/",
  authMiddleware,
  roleMiddleware(["CLIENT"]),
  controller.getProducts.bind(controller) as RequestHandler,
);

clientShopRouter.get(
  "/:id",
  authMiddleware,
  roleMiddleware(["CLIENT"]),
  controller.getProductById.bind(controller) as RequestHandler,
);

export default clientShopRouter;