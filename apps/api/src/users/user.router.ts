import { Router } from "express";
import type { RequestHandler, Router as RouterType } from "express";
import { authMiddleware, roleMiddleware } from "@api/middlewares";
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
  roleMiddleware(["ADMIN", "SECRETARY", "VETERINARIAN"]),
  controller.getUsers.bind(controller) as RequestHandler,
);
userRouter.post(
  "/me/avatar/upload",
  authMiddleware,
  controller.uploadAvatar.bind(controller) as RequestHandler,
);
userRouter.patch(
  "/me/avatar/confirm",
  authMiddleware,
  controller.confirmAvatar.bind(controller) as RequestHandler,
);

userRouter.get(
  "/:id/animals",
  authMiddleware,
  roleMiddleware(["VETERINARIAN", "SECRETARY", "CLIENT"]),
  animalController.getAllByUser.bind(animalController) as RequestHandler,
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
