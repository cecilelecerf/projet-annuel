import type { Request, Response, NextFunction } from "express";
import { ClinicService } from "./clinic.service";

export class ClinicController {
  constructor(private service: ClinicService) {}

  async getClinicStaff(req: Request, res: Response, next: NextFunction) {
    try {
      const staff = await this.service.getClinicStaff(
        req.user!.id,
        req.user!.role,
      );
      res.status(200).json(staff);
    } catch (err) {
      next(err);
    }
  }

  async getMyClinic(req: Request, res: Response, next: NextFunction) {
    try {
      const clinic = await this.service.getMyClinic(req.user!.id);
      res.status(200).json(clinic);
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
