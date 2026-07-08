import { Router } from "express";
import type { RequestHandler } from "express";
import { authMiddleware, roleMiddleware, validate } from "@api/middlewares";
import { medicalHistoryController } from "@api/instances";
import { requireApprovedClinic } from "@api/middlewares/clinic-guard.middleware";
import { createMedicalHistorySchema } from "@armali/schemas";

const animalMedicalHistoryRouter: Router = Router();
const controller = medicalHistoryController;

animalMedicalHistoryRouter.use(authMiddleware);
animalMedicalHistoryRouter.use(requireApprovedClinic);

animalMedicalHistoryRouter.post(
  "/",
  roleMiddleware(["VETERINARIAN", "SECRETARY", "CLIENT"]),
  validate(createMedicalHistorySchema),
  controller.create.bind(controller) as RequestHandler,
);

animalMedicalHistoryRouter.patch(
  "/:id",
  roleMiddleware(["VETERINARIAN", "CLIENT"]),
  controller.update.bind(controller) as RequestHandler,
);

animalMedicalHistoryRouter.delete(
  "/:id",
  roleMiddleware(["VETERINARIAN", "SECRETARY"]),
  controller.delete.bind(controller) as RequestHandler,
);

export default animalMedicalHistoryRouter;
