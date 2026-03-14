import { Router } from "express";
import type { RequestHandler, Router as RouterType } from "express";
import { authMiddleware } from "@api/middlewares/auth.middleware";
import { roleMiddleware } from "@api/middlewares/role.middleware";
import { UserController } from "@api/controllers/user.controller";

const userRouter: RouterType = Router();
const controller = new UserController();

userRouter.get(
  "/",
  authMiddleware,
  roleMiddleware(["ADMIN", "DIRECTOR", "REFERANT"]),
  controller.getUsers.bind(controller) as RequestHandler,
);
userRouter.get(
  "/:role",
  authMiddleware,
  roleMiddleware(["SECRETARY", "DIRECTOR", "REFERANT", "ADMIN"]),
  controller.getUsersByRole.bind(controller) as RequestHandler,
);
userRouter.get(
  "/:id",
  authMiddleware,
  roleMiddleware(["SECRETARY", "DIRECTOR", "REFERANT", "ADMIN"]),
  controller.getUserById.bind(controller) as RequestHandler,
);

export default userRouter;
