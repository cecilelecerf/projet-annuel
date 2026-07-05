import type { Request, Response, NextFunction } from "express";
import { ClinicService } from "./clinic.service";
import { clinicSchema } from "@armali/schemas";
import { AuthenticatedRequest } from "@api/middlewares";

export class ClinicController {
  constructor(private service: ClinicService) {}

  async getStaffByClinic(req: Request, res: Response, next: NextFunction) {
    try {
      const staff = await this.service.getStaffByClinic(
        req.user!.id,
        req.user!.role,
      );
      res.status(200).json(staff);
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
      const clinics = await this.service.getMyClinic(req.user.id);
      res.status(200).json(clinicSchema.array().parse(clinics));
    } catch (err) {
      next(err);
    }
  }

  async updateClinic(req: Request, res: Response, next: NextFunction) {
    try {
      const clinic = await this.service.updateClinic(req.user!.id, req.body);
      res.status(200).json(clinic);
    } catch (err) {
      next(err);
    }
  }
}
