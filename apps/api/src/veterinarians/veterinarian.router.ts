import { Router } from "express";
import type { RequestHandler, Router as RouterType } from "express";
import { authMiddleware, roleMiddleware, validate } from "@api/middlewares";
import { STAFF_ROLES } from "@api/utils";
import {
  meetingController,
  reviewController,
  veterinarianPetController,
  veterinarianSpecialityController,
} from "@api/instances";
import { requireApprovedClinic } from "@api/middlewares/clinic-guard.middleware";
import { updateVeterinarianSpecialitiesSchema } from "../../../../packages/schemas/src/veterinarians/veterinarian-speciality.schema";
import { updateVeterinarianPetsSchema } from "../../../../packages/schemas/src/veterinarians/veterinarian-pet.schema";

const veterinarianRouter: RouterType = Router();

veterinarianRouter.use(authMiddleware);
veterinarianRouter.use(requireApprovedClinic);

veterinarianRouter.get(
  "/:id/availabilities/timeline",
  roleMiddleware(STAFF_ROLES),
  meetingController.getAvailabilityTimeline.bind(
    meetingController,
  ) as RequestHandler,
);

veterinarianRouter.get(
  "/:id/reviews/stats",
  roleMiddleware(["REFERENT", "DIRECTOR"]),
  reviewController.getStats.bind(reviewController) as RequestHandler,
);

veterinarianRouter.get(
  "/:id/specialities",
  veterinarianSpecialityController.getAcceptedSpecialities.bind(
    veterinarianSpecialityController,
  ) as RequestHandler,
);

veterinarianRouter.patch(
  "/:id/specialities",
  roleMiddleware(["VETERINARIAN"]),
  validate(updateVeterinarianSpecialitiesSchema),
  veterinarianSpecialityController.setAcceptedSpecialities.bind(
    veterinarianSpecialityController,
  ) as RequestHandler,
);

veterinarianRouter.get(
  "/:id/pets",
  veterinarianPetController.getAcceptedPets.bind(
    veterinarianPetController,
  ) as RequestHandler,
);

veterinarianRouter.patch(
  "/:id/pets",
  roleMiddleware(["VETERINARIAN"]),
  validate(updateVeterinarianPetsSchema),
  veterinarianPetController.setAcceptedPets.bind(
    veterinarianPetController,
  ) as RequestHandler,
);

export default veterinarianRouter;
