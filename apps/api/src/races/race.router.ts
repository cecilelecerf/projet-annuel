import { Router } from "express";
import type { RequestHandler } from "express";
import { authMiddleware, roleMiddleware } from "@api/middlewares";
import { raceController } from "@api/instances";

const raceRouter: Router = Router();
const controller = raceController;

raceRouter.use(authMiddleware);

raceRouter.get("/:id", controller.getById.bind(controller) as RequestHandler);

raceRouter.post(
  "/",
  roleMiddleware(["ADMIN"]),
  controller.create.bind(controller) as RequestHandler,
);

raceRouter.patch(
  "/:id",
  roleMiddleware(["ADMIN"]),
  controller.update.bind(controller) as RequestHandler,
);

raceRouter.delete(
  "/:id",
  roleMiddleware(["ADMIN"]),
  controller.delete.bind(controller) as RequestHandler,
);

export default raceRouter;
