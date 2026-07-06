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

export class PrescriptionController {
  constructor(private service: PrescriptionService) {}

  async getByMeeting(
    req: RequestWithParams<{ id: MeetingId }>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const prescriptions = await this.service.getByMeeting(req.params.id);
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
      const prescription = await this.service.getById(req.params.id);
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
      const prescription = await this.service.create(
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
      const prescription = await this.service.update(
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
      await this.service.delete(req.params.id, req.user.role);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
}
