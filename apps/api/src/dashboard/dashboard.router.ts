import { Router } from "express";
import type { RequestHandler } from "express";
import { authMiddleware, roleMiddleware } from "@api/middlewares";
import { dashboardController } from "@api/instances";

const dashboardRouter: Router = Router();
const controller = dashboardController;

dashboardRouter.get(
  "/",
  authMiddleware,
  roleMiddleware([
    "REFERENT",
    "DIRECTOR",
    "SECRETARY",
    "VETERINARIAN",
    "ADMIN",
  ]),
  controller.getDashboard.bind(controller) as RequestHandler,
);

export default dashboardRouter;
