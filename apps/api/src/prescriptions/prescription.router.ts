import { Router } from "express";
import type { RequestHandler } from "express";
import { authMiddleware, roleMiddleware } from "@api/middlewares";
import { prescriptionController } from "@api/instances";

const prescriptionRouter: Router = Router();
const controller = prescriptionController;
const allowedRoles = [
  "VETERINARIAN",
  "SECRETARY",
  "DIRECTOR",
  "REFERANT",
  "ADMIN",
] as const;

prescriptionRouter.get(
  "/:id",
  authMiddleware,
  roleMiddleware([...allowedRoles]),
  controller.getById.bind(controller) as RequestHandler,
);

prescriptionRouter.post(
  "/",
  authMiddleware,
  roleMiddleware(["VETERINARIAN"]),
  controller.create.bind(controller) as RequestHandler,
);

prescriptionRouter.patch(
  "/:id",
  authMiddleware,
  roleMiddleware(["VETERINARIAN"]),
  controller.update.bind(controller) as RequestHandler,
);

prescriptionRouter.delete(
  "/:id",
  authMiddleware,
  roleMiddleware(["VETERINARIAN"]),
  controller.delete.bind(controller) as RequestHandler,
);

export default prescriptionRouter;
