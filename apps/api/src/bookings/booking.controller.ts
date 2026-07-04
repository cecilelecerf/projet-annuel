import type { NextFunction, Response } from "express";
import { BookingService } from "./booking.service";
import {
  bookingSearchQuerySchema,
  bookingClinicSchema,
  bookingVetSchema,
  bookingConfirmationSchema,
  createBookingSchema,
  ClinicId,
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
