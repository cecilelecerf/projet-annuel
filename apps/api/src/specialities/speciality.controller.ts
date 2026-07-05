import type { Request, Response, NextFunction } from "express";
import { SpecialityService } from "./speciality.service";

const specialityService = new SpecialityService();

export class SpecialityController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const specialities = await specialityService.getAll();
      res.status(200).json(specialities);
    } catch (err) {
      next(err);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const speciality = await specialityService.create(req.body);
      res.status(201).json(speciality);
    } catch (err) {
      next(err);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const speciality = await specialityService.update(
        req.params.id,
        req.body,
      );
      res.status(200).json(speciality);
    } catch (err) {
      next(err);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await specialityService.delete(req.params.id);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
}
