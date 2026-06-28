import { Router } from "express";
import type { RequestHandler } from "express";
import { authMiddleware, roleMiddleware } from "@api/middlewares";
import { PrescriptionController } from "./prescription.controller";

const prescriptionRouter: Router = Router();
const controller = new PrescriptionController();

const allowedRoles = [
  "VETERINARIAN",
  "SECRETARY",
  "DIRECTOR",
  "REFERANT",
  "ADMIN",
] as const;

prescriptionRouter.get(
  "/meeting/:meetingId",
  authMiddleware,
  roleMiddleware([...allowedRoles]),
  controller.getByMeeting.bind(controller) as RequestHandler,
);

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
