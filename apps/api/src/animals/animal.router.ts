import { Router } from "express";
import type { RequestHandler } from "express";
import { authMiddleware, roleMiddleware, validate } from "@api/middlewares";
import { createAnimalSchema, updateAnimalSchema } from "@armali/schemas";
import {
  animalController,
  animalMeetingController,
  medicalHistoryController,
} from "@api/instances";
import { requireApprovedClinic } from "@api/middlewares/clinic-guard.middleware";

const animalRouter: Router = Router();
const controller = animalController;
animalRouter.use(authMiddleware);
animalRouter.use(requireApprovedClinic);

animalRouter.get("/", controller.getAll.bind(controller) as RequestHandler);

animalRouter.get("/:id", controller.getById.bind(controller) as RequestHandler);
animalRouter.get(
  "/:id/vaccines",
  controller.getVaccines.bind(controller) as RequestHandler,
);
animalRouter.get(
  "/:id/emergency-qr",
  controller.getEmergencyQr.bind(controller) as RequestHandler,
);
animalRouter.get(
  "/:id/animal-meetings",
  roleMiddleware(["VETERINARIAN", "SECRETARY", "CLIENT"]),
  animalMeetingController.getByAnimal.bind(
    animalMeetingController,
  ) as RequestHandler,
);

animalRouter.get(
  "/:id/medical-histories",
  roleMiddleware(["VETERINARIAN", "SECRETARY", "CLIENT"]),
  medicalHistoryController.getByAnimal.bind(
    medicalHistoryController,
  ) as RequestHandler,
);

animalRouter.post(
  "/:id/photo/upload",
  controller.uploadPhoto.bind(controller) as RequestHandler,
);
animalRouter.patch(
  "/:id/photo/confirm",
  controller.confirmPhoto.bind(controller) as RequestHandler,
);

animalRouter.post(
  "/",
  validate(createAnimalSchema),
  controller.create.bind(controller) as RequestHandler,
);

animalRouter.patch(
  "/:id",
  validate(updateAnimalSchema),
  controller.update.bind(controller) as RequestHandler,
);

animalRouter.delete(
  "/:id",
  roleMiddleware(["CLIENT"]),
  controller.delete.bind(controller) as RequestHandler,
);

export default animalRouter;
