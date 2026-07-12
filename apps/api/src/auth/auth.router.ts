import { validate, authMiddleware } from "@api/middlewares";
import { Router } from "express";
import type { RequestHandler, Router as RouterType } from "express";
import {
  loginSchema,
  registerSchema,
  registerDirectorSchema,
  deleteAccountConfirmSchema,
  updateAccountSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyLoginTwoFactorSchema,
} from "@armali/schemas";
import { authController } from "@api/instances";

const authRouter: RouterType = Router();
const controller = authController;
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
authRouter.post(
  "/logout",
  authMiddleware,
  controller.logout.bind(controller) as RequestHandler,
);
authRouter.post("/refresh", controller.refresh.bind(controller));
authRouter.post(
  "/login/verify-2fa",
  validate(verifyLoginTwoFactorSchema),
  controller.verifyLoginTwoFactor.bind(controller),
);
authRouter.post(
  "/forgot-password",
  validate(forgotPasswordSchema),
  controller.forgotPassword.bind(controller),
);
authRouter.post(
  "/reset-password",
  validate(resetPasswordSchema),
  controller.resetPassword.bind(controller),
);
authRouter.get("/me", authMiddleware, controller.me.bind(controller));
authRouter.patch(
  "/me",
  authMiddleware,
  validate(updateAccountSchema),
  controller.updateAccount.bind(controller),
);

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
