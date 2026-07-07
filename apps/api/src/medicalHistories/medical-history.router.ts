import { Router } from "express";
import type { RequestHandler } from "express";
import { authMiddleware, roleMiddleware } from "@api/middlewares";
import { STAFF_ROLES } from "@api/utils";
import { medicalHistoryController } from "@api/instances";
import { requireApprovedClinic } from "@api/middlewares/clinic-guard.middleware";

const animalMedicalHistoryRouter: Router = Router();
const controller = medicalHistoryController;

animalMedicalHistoryRouter.use(authMiddleware);
animalMedicalHistoryRouter.use(requireApprovedClinic);

animalMedicalHistoryRouter.get(
  "/:id",
  roleMiddleware(STAFF_ROLES),
  controller.getById.bind(controller) as RequestHandler,
);

animalMedicalHistoryRouter.post(
  "/",
  roleMiddleware(["VETERINARIAN", "SECRETARY"]),
  controller.create.bind(controller) as RequestHandler,
);

animalMedicalHistoryRouter.patch(
  "/:id",
  roleMiddleware(["VETERINARIAN"]),
  controller.update.bind(controller) as RequestHandler,
);

animalMedicalHistoryRouter.delete(
  "/:id",
  roleMiddleware(["VETERINARIAN", "SECRETARY"]),
  controller.delete.bind(controller) as RequestHandler,
);

export default animalMedicalHistoryRouter;
