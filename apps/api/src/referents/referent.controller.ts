import type { Request, Response, NextFunction } from "express";
import type { RequestWithParams } from "@api/middlewares";
import { ReferentService } from "./referent.service";

export class ReferentController {
  constructor(private service: ReferentService) {}

  async updateClinic(req: Request, res: Response, next: NextFunction) {
    try {
      const clinic = await this.service.updateClinic(req.user!.id, req.body);
      res.status(200).json(clinic);
    } catch (err) {
      next(err);
    }
  }

  async getClinicSpecialities(req: Request, res: Response, next: NextFunction) {
    try {
      const specialities = await this.service.getClinicSpecialities(
        req.user!.id,
      );
      res.status(200).json(specialities);
    } catch (err) {
      next(err);
    }
  }

  async updateClinicSpecialities(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const specialities = await this.service.updateClinicSpecialities(
        req.user!.id,
        req.body,
      );
      res.status(200).json(specialities);
    } catch (err) {
      next(err);
    }
  }

  async getDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const dashboard = await this.service.getDashboard(req.user!.id);
      res.status(200).json(dashboard);
    } catch (err) {
      next(err);
    }
  }
}
