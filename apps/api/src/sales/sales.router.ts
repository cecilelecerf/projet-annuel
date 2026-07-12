import { Router } from "express";
import type { RequestHandler } from "express";
import { authMiddleware, roleMiddleware } from "@api/middlewares";
import { salesController } from "@api/instances";

const salesRouter: Router = Router();
const controller = salesController;

salesRouter.get(
  "/",
  authMiddleware,
  roleMiddleware(["REFERENT", "DIRECTOR"]),
  controller.getReport.bind(controller) as RequestHandler,
);

export default salesRouter;
