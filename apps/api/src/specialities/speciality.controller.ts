import type { NextFunction, Response } from "express";
import type { AuthenticatedRequest, RequestWithParams } from "@api/middlewares";
import { BadRequestError } from "@api/errors";
import {
  ClinicId,
  createSpecialitySchema,
  SpecialityId,
  specialitySchema,
  updateSpecialitySchema,
  type CreateSpeciality,
  type UpdateSpeciality,
} from "@armali/schemas";
import { SpecialityService } from "./speciality.service";

export class SpecialityController {
  constructor(private service: SpecialityService) {}

  async getAll(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const search =
        typeof req.query.search === "string" ? req.query.search : undefined;
      const specialities = await this.service.getAll(search);
      res.status(200).json(specialitySchema.array().parse(specialities));
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
      return res.status(200).json(specialitySchema.parse(speciality));
    } catch (err) {
      next(err);
    }
  }

  async create(
    req: AuthenticatedRequest & { body: CreateSpeciality },
    res: Response,
    next: NextFunction,
  ) {
    try {
      const result = createSpecialitySchema.safeParse(req.body);
      if (!result.success) throw new BadRequestError(result.error.message);
      const speciality = await this.service.create(result.data, req.user.role);
      res.status(201).json(specialitySchema.parse(speciality));
    } catch (err) {
      next(err);
    }
  }

  async update(
    req: RequestWithParams<{ id: SpecialityId }> & { body: UpdateSpeciality },
    res: Response,
    next: NextFunction,
  ) {
    try {
      const result = updateSpecialitySchema.safeParse(req.body);
      if (!result.success) throw new BadRequestError(result.error.message);
      const speciality = await this.service.update(
        req.params.id,
        result.data,
        req.user.role,
      );
      res.status(200).json(specialitySchema.parse(speciality));
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
      await this.service.delete(req.params.id, req.user.role);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
}
