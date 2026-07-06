import type { Response, NextFunction } from "express";
import { ClinicService } from "./clinic.service";
import {
  baseUserSchema,
  clientProfileSchema,
  clientSchema,
  ClinicId,
  clinicSchema,
  staffMemberSchema,
} from "@armali/schemas";
import { AuthenticatedRequest, RequestWithParams } from "@api/middlewares";
import z from "zod";

export class ClinicController {
  constructor(private service: ClinicService) {}
  async getClientsByClinic(
    req: RequestWithParams<{ id: ClinicId }>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const clients = await this.service.getClientsByClinic({
        authorId: req.user.id,
        clinicId: req.params.id,
        role: req.user.role,
      });
      res
        .status(200)
        .json(
          clientProfileSchema
            .extend({ user: baseUserSchema })
            .array()
            .parse(clients),
        );
    } catch (err) {
      next(err);
    }
  }

  async getMyClinic(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const clinics = await this.service.getClinicByUser(req.user.id);
      res.status(200).json(clinicSchema.array().parse(clinics));
    } catch (err) {
      next(err);
    }
  }

  async updateClinic(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const clinic = await this.service.updateClinic(req.user!.id, req.body);
      res.status(200).json(clinic);
    } catch (err) {
      next(err);
    }
  }
}
