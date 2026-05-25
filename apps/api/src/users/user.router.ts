import { Router } from "express";
import type { RequestHandler, Router as RouterType } from "express";
import { authMiddleware, roleMiddleware } from "@api/middlewares";
import { UserController } from "@api/users/user.controller";
import { STAFF_ROLES } from "@api/utils";

const userRouter: RouterType = Router();
const controller = new UserController();

userRouter.get(
  "/",
  authMiddleware,
  roleMiddleware(["ADMIN", "DIRECTOR", "REFERANT"]),
  controller.getUsers.bind(controller) as RequestHandler,
);
userRouter.get(
  "/roles/:role",
  authMiddleware,
  roleMiddleware(STAFF_ROLES),
  controller.getUsersByRole.bind(controller) as RequestHandler,
);
userRouter.get(
  "/:id",
  authMiddleware,
  controller.getUserById.bind(controller) as RequestHandler,
);

export default userRouter;
