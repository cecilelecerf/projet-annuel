import { Router } from "express";
import type { RequestHandler } from "express";
import { roleMiddleware } from "@api/middlewares";
import { prescriptionController } from "@api/instances";
import { requireApprovedClinic } from "@api/middlewares/clinic-guard.middleware";
import { authMiddleware } from "@api/middlewares";

const prescriptionRouter: Router = Router();
const controller = prescriptionController;
const allowedRoles = [
  "VETERINARIAN",
  "SECRETARY",
  "DIRECTOR",
  "REFERENT",
  "ADMIN",
] as const;

prescriptionRouter.use(authMiddleware);
prescriptionRouter.use(requireApprovedClinic);
prescriptionRouter.get(
  "/:id",
  roleMiddleware([...allowedRoles]),
  controller.getById.bind(controller) as RequestHandler,
);

prescriptionRouter.post(
  "/",
  roleMiddleware(["VETERINARIAN"]),
  controller.create.bind(controller) as RequestHandler,
);

prescriptionRouter.patch(
  "/:id",
  roleMiddleware(["VETERINARIAN"]),
  controller.update.bind(controller) as RequestHandler,
);

prescriptionRouter.delete(
  "/:id",
  roleMiddleware(["VETERINARIAN"]),
  controller.delete.bind(controller) as RequestHandler,
);

export default prescriptionRouter;
