import { Router } from "express";
import type { RequestHandler } from "express";
import { authMiddleware, roleMiddleware } from "@api/middlewares";
import { budgetController } from "@api/instances";

const budgetRouter: Router = Router();
const controller = budgetController;

budgetRouter.get(
  "/",
  authMiddleware,
  roleMiddleware(["REFERENT", "DIRECTOR"]),
  controller.getSummary.bind(controller) as RequestHandler,
);

budgetRouter.post(
  "/credit",
  authMiddleware,
  roleMiddleware(["DIRECTOR"]),
  controller.credit.bind(controller) as RequestHandler,
);

export default budgetRouter;