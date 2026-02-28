import { Router } from "express";
import type { Router as RouterType } from "express";
import { authMiddleware } from "@api/middlewares/auth.middleware";
import { roleMiddleware } from "@api/middlewares/role.middleware";
import { MettingController } from "@api/controllers/metting.controller";

const authRouter: RouterType = Router();
const controller = new MettingController();

authRouter.get(
  "/mettings",
  authMiddleware,
  roleMiddleware(["VETERINARIAN", "SECRETARY", "DIRECTOR", "REFERANT"]),
  controller.getMyCalendar.bind(controller),
);

export default authRouter;
