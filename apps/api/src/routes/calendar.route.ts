import { Router } from "express";
import type { RequestHandler, Router as RouterType } from "express";
import { authMiddleware } from "@api/middlewares/auth.middleware";
import { roleMiddleware } from "@api/middlewares/role.middleware";
import { MettingController } from "@api/controllers/calendar.controller";

const mettingRouter: RouterType = Router();
const controller = new MettingController();

mettingRouter.get(
  "/",
  authMiddleware,
  roleMiddleware(["VETERINARIAN", "SECRETARY"]),
  controller.getMyCalendar.bind(controller) as RequestHandler,
);
mettingRouter.get(
  "/:veterinarianId/mettings",
  authMiddleware,
  roleMiddleware(["SECRETARY"]),
  controller.getVeterinarianMetting.bind(controller) as RequestHandler,
);
mettingRouter.get(
  "/:veterinarianId",
  authMiddleware,
  roleMiddleware(["SECRETARY"]),
  controller.getVeterinarianCalendar.bind(controller) as RequestHandler,
);

export default mettingRouter;
