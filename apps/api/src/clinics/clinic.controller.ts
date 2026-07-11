import type { Request, Response, NextFunction } from "express";
import { ClinicService } from "./clinic.service";
import { BadRequestError } from "@api/errors";
import { clinicImagePublicPath } from "@api/middlewares/upload.middleware";

const clinicService = new ClinicService();

export class ClinicController {
  async getClinicStaff(req: Request, res: Response, next: NextFunction) {
    try {
      const staff = await clinicService.getClinicStaff(
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
      const clinic = await clinicService.getMyClinic(req.user!.id);
      res.status(200).json(clinic);
    } catch (err) {
      next(err);
    }
  }

  async updateClinic(req: Request, res: Response, next: NextFunction) {
    try {
      const clinic = await clinicService.updateClinic(req.user!.id, req.body);
      res.status(200).json(clinic);
    } catch (err) {
      next(err);
    }
  }

  async uploadImage(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) throw new BadRequestError("Aucune image fournie");
      const clinic = await clinicService.updateClinicImage(
        req.user!.id,
        clinicImagePublicPath(req.file.filename),
      );
      res.status(200).json(clinic);
    } catch (err) {
      next(err);
    }
  }
}
