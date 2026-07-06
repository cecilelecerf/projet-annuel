import type { NextFunction, Response } from "express";
import {
  specialitySchema,
  createSpecialitySchema,
  updateSpecialitySchema,
  SpecialityId,
} from "@armali/schemas";
import { AuthenticatedRequest, RequestWithParams } from "@api/middlewares";
import { SpecialityService } from "./speciality.service";

export class SpecialityController {
  constructor(private readonly service: SpecialityService) {}

  async getAll(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const specialities = await this.service.getAll();
      return res.json(specialitySchema.array().parse(specialities));
    } catch (err) {
      next(err);
    }
  }

  async getById(
    req: RequestWithParams<{ id: SpecialityId }>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const speciality = await this.service.getById(req.params.id);
      return res.json(specialitySchema.parse(speciality));
    } catch (err) {
      next(err);
    }
  }

  async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = createSpecialitySchema.parse(req.body);
      const speciality = await this.service.create(data);
      return res.status(201).json(specialitySchema.parse(speciality));
    } catch (err) {
      next(err);
    }
  }

  async update(
    req: RequestWithParams<{ id: SpecialityId }>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const data = updateSpecialitySchema.parse(req.body);
      const speciality = await this.service.update(req.params.id, data);
      return res.json(specialitySchema.parse(speciality));
    } catch (err) {
      next(err);
    }
  }

  async delete(
    req: RequestWithParams<{ id: SpecialityId }>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      await this.service.delete(req.params.id);
      return res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
}
