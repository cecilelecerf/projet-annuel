import type { NextFunction, Response } from "express";
import type { AuthenticatedRequest, RequestWithParams } from "@api/middlewares";
import { BadRequestError } from "@api/errors";
import {
  createPrescriptionSchema,
  MeetingId,
  updatePrescriptionSchema,
  type CreatePrescription,
  type UpdatePrescription,
} from "@armali/schemas";
import { PrescriptionService } from "./prescription.service";

const prescriptionService = new PrescriptionService();

export class PrescriptionController {
  async getByMeeting(
    req: RequestWithParams<{ meetingId: MeetingId }>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const prescriptions = await prescriptionService.getByMeeting(
        req.params.meetingId,
      );
      console.log(prescriptions);
      res.status(200).json(prescriptions);
    } catch (err) {
      next(err);
    }
  }

  async getById(
    req: RequestWithParams<{ id: string }>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const prescription = await prescriptionService.getById(req.params.id);
      res.status(200).json(prescription);
    } catch (err) {
      next(err);
    }
  }

  async create(
    req: AuthenticatedRequest & { body: CreatePrescription },
    res: Response,
    next: NextFunction,
  ) {
    try {
      const result = createPrescriptionSchema.safeParse(req.body);
      if (!result.success) throw new BadRequestError(result.error.message);
      const prescription = await prescriptionService.create(
        result.data,
        req.user.role,
      );
      res.status(201).json(prescription);
    } catch (err) {
      next(err);
    }
  }

  async update(
    req: RequestWithParams<{ id: string }> & { body: UpdatePrescription },
    res: Response,
    next: NextFunction,
  ) {
    try {
      const result = updatePrescriptionSchema.safeParse(req.body);
      if (!result.success) throw new BadRequestError(result.error.message);
      const prescription = await prescriptionService.update(
        req.params.id,
        result.data,
        req.user.role,
      );
      res.status(200).json(prescription);
    } catch (err) {
      next(err);
    }
  }

  async delete(
    req: RequestWithParams<{ id: string }>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      await prescriptionService.delete(req.params.id, req.user.role);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
}
