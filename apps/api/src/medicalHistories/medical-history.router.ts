import { Router } from "express";
import type { RequestHandler } from "express";
import { authMiddleware, roleMiddleware } from "@api/middlewares";
import { AnimalMedicalHistoryController } from "./medical-history.controller";
import { STAFF_ROLES } from "@api/utils";

const animalMedicalHistoryRouter: Router = Router();
const controller = new AnimalMedicalHistoryController();

animalMedicalHistoryRouter.get(
  "/meeting/:meetingId",
  authMiddleware,
  roleMiddleware(STAFF_ROLES),
  controller.getByMeeting.bind(controller) as RequestHandler,
);

animalMedicalHistoryRouter.get(
  "/:id",
  authMiddleware,
  roleMiddleware(STAFF_ROLES),
  controller.getById.bind(controller) as RequestHandler,
);

animalMedicalHistoryRouter.post(
  "/",
  authMiddleware,
  roleMiddleware(["VETERINARIAN", "SECRETARY"]),
  controller.create.bind(controller) as RequestHandler,
);

animalMedicalHistoryRouter.patch(
  "/:id",
  authMiddleware,
  roleMiddleware(["VETERINARIAN"]),
  controller.update.bind(controller) as RequestHandler,
);

animalMedicalHistoryRouter.delete(
  "/:id",
  authMiddleware,
  roleMiddleware(["VETERINARIAN", "SECRETARY"]),
  controller.delete.bind(controller) as RequestHandler,
);

export default animalMedicalHistoryRouter;
