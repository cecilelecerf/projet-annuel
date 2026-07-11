import { Router } from "express";
import type { RequestHandler } from "express";
import { authMiddleware, roleMiddleware } from "@api/middlewares";
import { clientShopController } from "@api/instances";

const clientShopRouter: Router = Router();
const controller = clientShopController;

// ── Routes spécifiques AVANT /:id, sinon Express interprète "animals" comme
// un id de produit ──────────────────────────────────────────────────────────

clientShopRouter.get(
  "/animals",
  authMiddleware,
  roleMiddleware(["CLIENT"]),
  controller.getAnimals.bind(controller) as RequestHandler,
);

clientShopRouter.get(
  "/recommendations/:animalId",
  authMiddleware,
  roleMiddleware(["CLIENT"]),
  controller.getFoodRecommendations.bind(controller) as RequestHandler,
);

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