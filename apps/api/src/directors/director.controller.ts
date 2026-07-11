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

  async searchVeterinarian(req: Request, res: Response, next: NextFunction) {
    try {
      const query = typeof req.query.q === "string" ? req.query.q : "";
      const results = await directorService.searchVeterinarian(
        req.user!.id,
        query,
      );
      res.status(200).json(results);
    } catch (err) {
      next(err);
    }
  }

  async linkVeterinarian(req: Request, res: Response, next: NextFunction) {
    try {
      const linked = await directorService.linkVeterinarian(
        req.user!.id,
        req.body.veterinarianId,
      );
      res.status(201).json(linked);
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

  async linkSpeciality(req: Request, res: Response, next: NextFunction) {
    try {
      const clinic = await directorService.linkSpeciality(
        req.user!.id,
        req.params.specialityId as string,
      );
      res.status(200).json(clinic);
    } catch (err) {
      next(err);
    }
  }

  async unlinkSpeciality(req: Request, res: Response, next: NextFunction) {
    try {
      const clinic = await directorService.unlinkSpeciality(
        req.user!.id,
        req.params.specialityId as string,
      );
      res.status(200).json(clinic);
    } catch (err) {
      next(err);
    }
  }

  async deleteStaffMember(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await directorService.deleteStaffMember(
        req.user!.id,
        req.params.id as string,
      );
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async getAnalyticsOverview(req: Request, res: Response, next: NextFunction) {
    try {
      const overview = await directorService.getAnalyticsOverview(
        req.user!.id,
      );
      res.status(200).json(overview);
    } catch (err) {
      next(err);
    }
  }
}
