import type { Request, Response, NextFunction } from "express";
import { ReferentService } from "./referent.service";

const referentService = new ReferentService();

export class ReferentController {
  async getClinicStaff(req: Request, res: Response, next: NextFunction) {
    try {
      const staff = await referentService.getClinicStaff(req.user!.id);
      res.status(200).json(staff);
    } catch (err) {
      next(err);
    }
  }

  async createVeterinarian(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await referentService.createVeterinarian(
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
      const user = await referentService.createSecretary(
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
      const results = await referentService.searchVeterinarian(
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
      const linked = await referentService.linkVeterinarian(
        req.user!.id,
        req.body.veterinarianId,
      );
      res.status(201).json(linked);
    } catch (err) {
      next(err);
    }
  }

  async updateClinic(req: Request, res: Response, next: NextFunction) {
    try {
      const clinic = await referentService.updateClinic(req.user!.id, req.body);
      res.status(200).json(clinic);
    } catch (err) {
      next(err);
    }
  }

  async linkSpeciality(req: Request, res: Response, next: NextFunction) {
    try {
      const clinic = await referentService.linkSpeciality(
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
      const clinic = await referentService.unlinkSpeciality(
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
      const result = await referentService.deleteStaffMember(
        req.user!.id,
        req.params.id as string,
      );
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async getVisitsForecast(req: Request, res: Response, next: NextFunction) {
    try {
      const forecast = await referentService.getVisitsForecast(req.user!.id);
      res.status(200).json(forecast);
    } catch (err) {
      next(err);
    }
  }
}
