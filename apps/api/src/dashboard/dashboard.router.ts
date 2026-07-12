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
    "CLIENT",
  ]),
  controller.getDashboard.bind(controller) as RequestHandler,
);

dashboardRouter.get(
  "/visits-forecast",
  authMiddleware,
  roleMiddleware(["REFERENT", "DIRECTOR"]),
  controller.getVisitsForecast.bind(controller) as RequestHandler,
);

dashboardRouter.get(
  "/analytics-overview",
  authMiddleware,
  roleMiddleware(["REFERENT", "DIRECTOR"]),
  controller.getAnalyticsOverview.bind(controller) as RequestHandler,
);

export default dashboardRouter;
