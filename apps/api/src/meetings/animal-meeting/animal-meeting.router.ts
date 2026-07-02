import { authMiddleware, roleMiddleware, validate } from "@api/middlewares";
import { Router } from "express";
import type { RequestHandler, Router as RouterType } from "express";
import {
  createAnimalMeetingSchema,
  updateAnimalMeetingSchema,
} from "@armali/schemas";
import {
  animalController,
  medicalHistoryController,
  prescriptionController,
} from "@api/instances";

const animalMeetingRouter: RouterType = Router();

const animalMedicalHistory = medicalHistoryController;

animalMeetingRouter.post(
  "/",
  authMiddleware,
  roleMiddleware(["VETERINARIAN", "SECRETARY", "CLIENT"]),
  validate(createAnimalMeetingSchema),
  animalController.create.bind(animalController) as RequestHandler,
);
animalMeetingRouter.get(
  "/",
  authMiddleware,
  roleMiddleware(["VETERINARIAN", "SECRETARY", "CLIENT"]),
  animalController.getByUser.bind(animalController) as RequestHandler,
);
animalMeetingRouter.get(
  "/:id/medical-histories",
  authMiddleware,
  animalMedicalHistory.getByMeeting.bind(
    animalMedicalHistory,
  ) as RequestHandler,
);
animalMeetingRouter.get(
  "/:id/prescriptions",
  authMiddleware,
  roleMiddleware(["VETERINARIAN", "SECRETARY", "CLIENT"]),
  prescriptionController.getByMeeting.bind(
    prescriptionController,
  ) as RequestHandler,
);
animalMeetingRouter.get(
  "/:id",
  authMiddleware,
  roleMiddleware(["VETERINARIAN", "SECRETARY", "CLIENT"]),
  animalController.getById.bind(animalController) as RequestHandler,
);
animalMeetingRouter.patch(
  "/:id",
  authMiddleware,
  roleMiddleware(["VETERINARIAN", "SECRETARY"]),
  validate(updateAnimalMeetingSchema),
  animalController.update.bind(animalController) as RequestHandler,
);
animalMeetingRouter.delete(
  "/:id",
  authMiddleware,
  roleMiddleware(["VETERINARIAN", "SECRETARY"]),
  animalController.delete.bind(animalController) as RequestHandler,
);
export default animalMeetingRouter;
