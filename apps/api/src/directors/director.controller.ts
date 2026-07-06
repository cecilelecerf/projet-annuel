import type { Request, Response, NextFunction } from "express";
import { DirectorService } from "./director.service";

export class DirectorController {
  constructor(private service: DirectorService) {}

  async createReferent(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await this.service.createReferent(req.user!.id, req.body);
      res.status(201).json(user);
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

  async getClinicStaff(req: Request, res: Response, next: NextFunction) {
    try {
      const staff = await this.service.getClinicStaff(req.user!.id);
      res.status(200).json(staff);
    } catch (err) {
      next(err);
    }
  }

  async getClinicStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const status = await this.service.getClinicStatus(req.user!.id);
      res.status(200).json(status);
    } catch (err) {
      next(err);
    }
  }

  async requestClinic(req: Request, res: Response, next: NextFunction) {
    try {
      const request = await this.service.requestClinic(req.user!.id, req.body);
      res.status(201).json(request);
    } catch (err) {
      next(err);
    }
  }

  async getMyRequests(req: Request, res: Response, next: NextFunction) {
    try {
      const requests = await this.service.getMyRequests(req.user!.id);
      res.status(200).json(requests);
    } catch (err) {
      next(err);
    }
  }
}
