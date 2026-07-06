import { Router } from "express";
import type { RequestHandler } from "express";
import { authMiddleware, roleMiddleware, validate } from "@api/middlewares";
import { createAnimalSchema, updateAnimalSchema } from "@armali/schemas";
import { animalController, animalMeetingController } from "@api/instances";
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
  "/:id/meetings",
  roleMiddleware(["VETERINARIAN", "SECRETARY", "CLIENT"]),
  animalMeetingController.getByAnimal.bind(
    animalMeetingController,
  ) as RequestHandler,
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
