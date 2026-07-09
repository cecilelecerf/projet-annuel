import type { NextFunction, Response } from "express";
import type { AuthenticatedRequest, RequestWithParams } from "@api/middlewares";
import { BadRequestError } from "@api/errors";
import {
  createVaccineSchema,
  PetId,
  updateVaccineSchema,
  vaccineSchema,
  type CreateVaccine,
  type UpdateVaccine,
} from "@armali/schemas";
import { VaccineService } from "./vaccine.service";

export class VaccineController {
  constructor(private service: VaccineService) {}

  async getAll(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const vaccines = await this.service.getAll();
      res.status(200).json(vaccineSchema.array().parse(vaccines));
    } catch (err) {
      next(err);
    }
  }

  async getById(
    req: RequestWithParams<{ id: string }>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const vaccine = await this.service.getById(req.params.id);
      res.status(200).json(vaccineSchema.parse(vaccine));
    } catch (err) {
      next(err);
    }
  }

  async getByPetId(
    req: RequestWithParams<{ id: PetId }>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const vaccines = await this.service.getByPetId(req.params.id);
      res.status(200).json(vaccineSchema.array().parse(vaccines));
    } catch (err) {
      next(err);
    }
  }

  async create(
    req: AuthenticatedRequest & { body: CreateVaccine },
    res: Response,
    next: NextFunction,
  ) {
    try {
      const result = createVaccineSchema.safeParse(req.body);
      if (!result.success) throw new BadRequestError(result.error.message);
      const vaccine = await this.service.create(result.data, req.user.role);
      res.status(201).json(vaccineSchema.parse(vaccine));
    } catch (err) {
      next(err);
    }
  }

  async update(
    req: RequestWithParams<{ id: string }> &
      AuthenticatedRequest & { body: UpdateVaccine },
    res: Response,
    next: NextFunction,
  ) {
    try {
      const result = updateVaccineSchema.safeParse(req.body);
      if (!result.success) throw new BadRequestError(result.error.message);
      const vaccine = await this.service.update(
        req.params.id,
        result.data,
        req.user.role,
      );
      res.status(200).json(vaccineSchema.parse(vaccine));
    } catch (err) {
      next(err);
    }
  }

  async delete(
    req: RequestWithParams<{ id: string }> & AuthenticatedRequest,
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
