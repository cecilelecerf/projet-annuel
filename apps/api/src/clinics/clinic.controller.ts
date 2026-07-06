import type { Response, NextFunction } from "express";
import { ClinicService } from "./clinic.service";
import {
  baseUserSchema,
  clientProfileSchema,
  ClinicId,
  clinicSchema,
} from "@armali/schemas";
import { AuthenticatedRequest, RequestWithParams } from "@api/middlewares";

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
      const clinic = await this.service.updateClinic({
        userId: req.user!.id,
        role: req.user.role,
        data: req.body,
      });
      res.status(200).json(clinicSchema.parse(clinic));
    } catch (err) {
      next(err);
    }
  }

  async getAllClinics(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const clinics = await this.service.getClinics();
      res.status(200).json(clinicSchema.array().parse(clinics));
    } catch (err) {
      next(err);
    }
  }

  async deleteClinic(
    req: RequestWithParams<{ id: ClinicId }>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const result = await this.service.deleteClinic(req.params.id);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
}
