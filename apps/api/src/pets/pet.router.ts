import { Router } from "express";
import type { RequestHandler } from "express";
import { authMiddleware, roleMiddleware } from "@api/middlewares";
import { petController, vaccineController } from "@api/instances";

const petRouter: Router = Router();
const controller = petController;
petRouter.use(authMiddleware);

petRouter.get("/", controller.getAll.bind(controller) as RequestHandler);
petRouter.get(
  "/:id/vaccines",
  vaccineController.getByPetId.bind(vaccineController) as RequestHandler,
);
petRouter.get("/:id", controller.getById.bind(controller) as RequestHandler);

petRouter.post(
  "/",
  roleMiddleware(["ADMIN"]),
  controller.create.bind(controller) as RequestHandler,
);

petRouter.patch(
  "/:id",
  roleMiddleware(["ADMIN"]),
  controller.update.bind(controller) as RequestHandler,
);

petRouter.delete(
  "/:id",
  roleMiddleware(["ADMIN"]),
  controller.delete.bind(controller) as RequestHandler,
);
export default petRouter;
