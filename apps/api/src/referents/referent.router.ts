import { Router } from "express";
import type { Router as RouterType } from "express";
import { authMiddleware } from "@api/middlewares/auth.middleware";
import { roleMiddleware } from "@api/middlewares/role.middleware";
import { referentController } from "@api/instances";

const referentRouter: RouterType = Router();
const controller = referentController;

referentRouter.get(
  "/dashboard",
  authMiddleware,
  roleMiddleware(["REFERENT"]),
  controller.getDashboard.bind(controller),
);

export default referentRouter;
