import type { Request, Response, NextFunction } from "express";
import type { RequestWithParams } from "@api/middlewares";
import { ReferentService } from "./referent.service";

export class ReferentController {
  constructor(private service: ReferentService) {}

  async getClinicStaff(req: Request, res: Response, next: NextFunction) {
    try {
      const staff = await this.service.getClinicStaff(req.user!.id);
      res.status(200).json(staff);
    } catch (err) {
      next(err);
    }
  }

  async getStaffMemberDetail(
    req: RequestWithParams<{ id: string }>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const member = await this.service.getStaffMemberDetail(
        req.user!.id,
        req.params.id,
      );
      res.status(200).json(member);
    } catch (err) {
      next(err);
    }
  }

  async createVeterinarian(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await this.service.createVeterinarian(
        req.user!.id,
        req.body,
      );
      res.status(201).json(user);
    } catch (err) {
      next(err);
    }
  }

  async createSecretary(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await this.service.createSecretary(req.user!.id, req.body);
      res.status(201).json(user);
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