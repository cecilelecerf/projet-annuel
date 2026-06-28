import type { Request, Response, NextFunction } from "express";
import { DirectorService } from "./director.service";

const directorService = new DirectorService();

export class DirectorController {
  async createReferent(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await directorService.createReferent(req.user!.id, req.body);
      res.status(201).json(user);
    } catch (err) {
      next(err);
    }
  }

  async createVeterinarian(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await directorService.createVeterinarian(
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
      const user = await directorService.createSecretary(
        req.user!.id,
        req.body,
      );
      res.status(201).json(user);
    } catch (err) {
      next(err);
    }
  }

  async getClinicStaff(req: Request, res: Response, next: NextFunction) {
    try {
      const staff = await directorService.getClinicStaff(req.user!.id);
      res.status(200).json(staff);
    } catch (err) {
      next(err);
    }
  }

  async getClinicStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const status = await directorService.getClinicStatus(req.user!.id);
      res.status(200).json(status);
    } catch (err) {
      next(err);
    }
  }

  async requestClinic(req: Request, res: Response, next: NextFunction) {
    try {
      const request = await directorService.requestClinic(
        req.user!.id,
        req.body,
      );
      res.status(201).json(request);
    } catch (err) {
      next(err);
    }
  }

  async getMyRequests(req: Request, res: Response, next: NextFunction) {
    try {
      const requests = await directorService.getMyRequests(req.user!.id);
      res.status(200).json(requests);
    } catch (err) {
      next(err);
    }
  }
}
