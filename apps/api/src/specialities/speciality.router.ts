import { Router } from "express";
import type { RequestHandler } from "express";
import { authMiddleware, roleMiddleware } from "@api/middlewares";
import { STAFF_ROLES } from "@api/utils";
import { specialityController } from "@api/instances";
import { requireApprovedClinic } from "@api/middlewares/clinic-guard.middleware";

const specialityRouter: Router = Router();
const controller = specialityController;

specialityRouter.use(authMiddleware);
specialityRouter.use(requireApprovedClinic);

specialityRouter.get("/", controller.getAll.bind(controller) as RequestHandler);

specialityRouter.get(
  "/:id",
  roleMiddleware(["ADMIN"]),
  controller.getById.bind(controller) as RequestHandler,
);

specialityRouter.post(
  "/",
  roleMiddleware(["ADMIN"]),
  controller.create.bind(controller) as RequestHandler,
);

specialityRouter.patch(
  "/:id",
  roleMiddleware(["ADMIN"]),
  controller.update.bind(controller) as RequestHandler,
);

specialityRouter.delete(
  "/:id",
  roleMiddleware(["ADMIN"]),
  controller.delete.bind(controller) as RequestHandler,
);

export default specialityRouter;
