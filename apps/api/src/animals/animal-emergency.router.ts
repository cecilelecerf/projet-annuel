import { Router } from "express";
import type { RequestHandler } from "express";
import { animalController } from "@api/instances";

const animalEmergencyRouter: Router = Router();

animalEmergencyRouter.get(
  "/:token",
  animalController.getEmergencyCard.bind(animalController) as RequestHandler,
);

export default animalEmergencyRouter;
