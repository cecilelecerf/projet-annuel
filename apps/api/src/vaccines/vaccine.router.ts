import { Router } from "express";
import type { RequestHandler } from "express";
import { authMiddleware, roleMiddleware } from "@api/middlewares";
import { vaccineController } from "@api/instances";

const vaccineRouter: Router = Router();
const controller = vaccineController;

vaccineRouter.use(authMiddleware);

vaccineRouter.get(
  "/",
  roleMiddleware(["ADMIN"]),
  controller.getAll.bind(controller) as RequestHandler,
);

vaccineRouter.get(
  "/pet/:petId",
  controller.getByPetId.bind(controller) as RequestHandler,
);

vaccineRouter.get(
  "/:id",
  controller.getById.bind(controller) as RequestHandler,
);

vaccineRouter.post(
  "/",
  roleMiddleware(["ADMIN"]),
  controller.create.bind(controller) as RequestHandler,
);

vaccineRouter.patch(
  "/:id",
  roleMiddleware(["ADMIN"]),
  controller.update.bind(controller) as RequestHandler,
);

vaccineRouter.delete(
  "/:id",
  roleMiddleware(["ADMIN"]),
  controller.delete.bind(controller) as RequestHandler,
);

export default vaccineRouter;
