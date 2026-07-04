import type { NextFunction, Response } from "express";
import { BookingService } from "./booking.service";
import {
  bookingSearchQuerySchema,
  bookingClinicSchema,
  bookingVetSchema,
  bookingSlotSchema,
  bookingConfirmationSchema,
  createBookingSchema,
  ClinicId,
  VeterinarianId,
} from "@armali/schemas";
import { AuthenticatedRequest, RequestWithParams } from "@api/middlewares";

export class BookingController {
  constructor(private service: BookingService) {}

  // GET /booking/clinics
  async searchClinics(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const query = bookingSearchQuerySchema.parse(req.query);
      const clinics = await this.service.searchClinics(query);
      return res.json(bookingClinicSchema.array().parse(clinics));
    } catch (err) {
      next(err);
    }
  }

  // GET /booking/clinics/:clinicId/vets
  async getClinicVets(
    req: RequestWithParams<{ clinicId: ClinicId }>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { clinicId } = req.params;
      const { date, specialityId, petId } = req.query as Record<string, string>;

      const vets = await this.service.getClinicVets({
        clinicId,
        date,
        specialityId,
        petId,
      });

      return res.json(bookingVetSchema.array().parse(vets));
    } catch (err) {
      next(err);
    }
  }

  // GET /booking/vets/:veterinarianId/slots
  async getVetSlots(
    req: RequestWithParams<{ veterinarianId: VeterinarianId }>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { veterinarianId } = req.params;
      const { clinicId, date } = req.query as Record<string, string>;

      if (!clinicId || !date) {
        return res.status(400).json({ error: "clinicId et date sont requis" });
      }

      const slots = await this.service.getVetSlots({
        veterinarianId,
        clinicId,
        date,
      });

      return res.json(bookingSlotSchema.array().parse(slots));
    } catch (err) {
      next(err);
    }
  }

  // POST /booking
  async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = createBookingSchema.parse(req.body);
      const result = await this.service.create(data, req.user!.id);
      return res.status(201).json(bookingConfirmationSchema.parse(result));
    } catch (err) {
      next(err);
    }
  }
}
