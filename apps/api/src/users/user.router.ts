import { Router } from "express";
import type { RequestHandler, Router as RouterType } from "express";
import { authMiddleware, roleMiddleware } from "@api/middlewares";
import { STAFF_ROLES } from "@api/utils";
import {
  animalController,
  animalMeetingController,
  userController,
} from "@api/instances";

const userRouter: RouterType = Router();

const controller = userController;

userRouter.get(
  "/",
  authMiddleware,
  roleMiddleware(["ADMIN", "DIRECTOR", "REFERANT"]),
  controller.getUserById.bind(controller) as RequestHandler,
);

userRouter.get(
  "/roles/:role",
  authMiddleware,
  roleMiddleware(STAFF_ROLES),
  controller.getUsersByRole.bind(controller) as RequestHandler,
);

userRouter.get(
  "/:id/animals",
  authMiddleware,
  roleMiddleware(["VETERINARIAN", "SECRETARY", "CLIENT"]),
  animalController.getByUser.bind(animalController) as RequestHandler,
);
userRouter.get(
  "/:id/animal-meetings",
  authMiddleware,
  roleMiddleware(["VETERINARIAN", "SECRETARY", "CLIENT"]),
  animalMeetingController.getByClient.bind(
    animalMeetingController,
  ) as RequestHandler,
);
userRouter.get(
  "/:id",
  authMiddleware,
  controller.getUserById.bind(controller) as RequestHandler,
);

export default userRouter;
