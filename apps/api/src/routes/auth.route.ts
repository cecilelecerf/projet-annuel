import { validate } from "@api/middlewares/validate.middleware";
import { AuthController } from "@api/controllers/auth.controller";
import { Router } from "express";
import type { Router as RouterType } from "express";
import { authMiddleware } from "@api/middlewares/auth.middleware";
import {
  loginSchema,
  registerSchema,
  registerDirectorSchema,
  deleteAccountConfirmSchema,
} from "@armali/schemas";

const authRouter: RouterType = Router();
const controller = new AuthController();

authRouter.post(
  "/register",
  validate(registerSchema),
  controller.register.bind(controller),
);
authRouter.post(
  "/register-director",
  validate(registerDirectorSchema),
  controller.registerDirector.bind(controller),
);
authRouter.post(
  "/login",
  validate(loginSchema),
  controller.login.bind(controller),
);
authRouter.post("/logout", authMiddleware, controller.logout.bind(controller));
authRouter.post("/refresh", controller.refresh.bind(controller));
authRouter.get("/me", authMiddleware, controller.me.bind(controller));

authRouter.post(
  "/delete-account/request",
  authMiddleware,
  controller.requestDeleteAccount.bind(controller),
);
authRouter.delete(
  "/delete-account",
  authMiddleware,
  validate(deleteAccountConfirmSchema),
  controller.confirmDeleteAccount.bind(controller),
);

export default authRouter;
