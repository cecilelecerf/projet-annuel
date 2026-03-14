import { validate } from "@api/middlewares/validate.middleware";
import { AuthController } from "@api/controllers/auth.controller";
import { Router } from "express";
import type { Router as RouterType } from "express";
import { authMiddleware } from "@api/middlewares/auth.middleware";
import { loginSchema, registerSchema } from "@armali/schemas";

const authRouter: RouterType = Router();
const controller = new AuthController();

authRouter.post(
  "/register",
  validate(registerSchema),
  controller.register.bind(controller),
);
authRouter.post(
  "/login",
  validate(loginSchema),
  controller.login.bind(controller),
);
authRouter.post("/logout", authMiddleware, controller.logout.bind(controller));

authRouter.get("/me", authMiddleware, controller.me.bind(controller));

export default authRouter;
