import { Router } from "express";
import type { RequestHandler } from "express";
import { authMiddleware, roleMiddleware } from "@api/middlewares";
import { budgetController } from "@api/instances";

const budgetRouter: Router = Router();
const controller = budgetController;

const BUDGET_MANAGER_ROLES = ["REFERENT", "DIRECTOR"] as const;

budgetRouter.get(
  "/",
  authMiddleware,
  roleMiddleware([...BUDGET_MANAGER_ROLES]),
  controller.getSummary.bind(controller) as RequestHandler,
);

budgetRouter.post(
  "/credit",
  authMiddleware,
  roleMiddleware([...BUDGET_MANAGER_ROLES]),
  controller.credit.bind(controller) as RequestHandler,
);

export default budgetRouter;