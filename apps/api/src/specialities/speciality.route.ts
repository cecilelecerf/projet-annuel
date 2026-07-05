import { Router } from "express";
import type { Router as RouterType } from "express";
import { authMiddleware } from "@api/middlewares/auth.middleware";
import { roleMiddleware } from "@api/middlewares/role.middleware";
import { validate } from "@api/middlewares/validate.middleware";
import { createSpecialitySchema, updateSpecialitySchema } from "@armali/schemas";
import { SpecialityController } from "./speciality.controller";

const specialityRouter: RouterType = Router();
const controller = new SpecialityController();

specialityRouter.get("/", authMiddleware, controller.getAll.bind(controller));

specialityRouter.post(
  "/",
  authMiddleware,
  roleMiddleware(["ADMIN"]),
  validate(createSpecialitySchema),
  controller.create.bind(controller),
);

specialityRouter.patch(
  "/:id",
  authMiddleware,
  roleMiddleware(["ADMIN"]),
  validate(updateSpecialitySchema),
  controller.update.bind(controller),
);

specialityRouter.delete(
  "/:id",
  authMiddleware,
  roleMiddleware(["ADMIN"]),
  controller.delete.bind(controller),
);

export default specialityRouter;
