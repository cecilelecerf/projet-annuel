import { Router } from "express";
import type { RequestHandler } from "express";
import { authMiddleware, roleMiddleware } from "@api/middlewares";
import { STAFF_ROLES } from "@api/utils";
import { specialityController } from "@api/instances";

const specialityRouter: Router = Router();
const controller = specialityController;

specialityRouter.get(
  "/",
  authMiddleware,
  controller.getAll.bind(controller) as RequestHandler,
);

specialityRouter.get(
  "/:id",
  authMiddleware,
  roleMiddleware(STAFF_ROLES),
  controller.getById.bind(controller) as RequestHandler,
);

specialityRouter.post(
  "/",
  authMiddleware,
  roleMiddleware(["ADMIN"]),
  controller.create.bind(controller) as RequestHandler,
);

specialityRouter.patch(
  "/:id",
  authMiddleware,
  roleMiddleware(["ADMIN"]),
  controller.update.bind(controller) as RequestHandler,
);

specialityRouter.delete(
  "/:id",
  authMiddleware,
  roleMiddleware(["ADMIN"]),
  controller.delete.bind(controller) as RequestHandler,
);

export default specialityRouter;
