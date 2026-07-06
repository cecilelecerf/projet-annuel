import { authMiddleware, roleMiddleware, validate } from "@api/middlewares";
import { Router } from "express";
import type { RequestHandler, Router as RouterType } from "express";
import { createBookingSchema } from "@armali/schemas";
import { bookingController } from "@api/instances";

const bookingRouter: RouterType = Router();

// ── Recherche publique (ou client authentifié) ────────────────────────────────

// GET /booking/clinics?lat=&lng=&address=&radiusKm=&date=&specialityId=&petId=
bookingRouter.get(
  "/clinics",
  authMiddleware,
  roleMiddleware(["CLIENT"]),
  bookingController.searchClinics.bind(bookingController) as RequestHandler,
);

// GET /booking/clinics/:clinicId/vets?date=&specialityId=&petId=
bookingRouter.get(
  "/clinics/:clinicId/vets",
  authMiddleware,
  roleMiddleware(["CLIENT"]),
  bookingController.getClinicVets.bind(bookingController) as RequestHandler,
);

// GET /booking/vets/:veterinarianId/slots?clinicId=&date=

// ── Création du rendez-vous ───────────────────────────────────────────────────

// POST /booking
bookingRouter.post(
  "/",
  authMiddleware,
  roleMiddleware(["CLIENT"]),
  validate(createBookingSchema),
  bookingController.create.bind(bookingController) as RequestHandler,
);

export default bookingRouter;
