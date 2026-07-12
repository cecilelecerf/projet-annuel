import type { NextFunction, Response } from "express";
import type { AuthenticatedRequest, RequestWithParams } from "@api/middlewares";
import { BadRequestError } from "@api/errors";
import {
  createBrandSchema,
  updateBrandSchema,
  type CreateBrand,
  type UpdateBrand,
} from "@armali/schemas";
import { BrandService } from "./brand.service";

export class BrandController {
  constructor(private service: BrandService) {}

  async getAll(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const search =
        typeof req.query.search === "string" ? req.query.search : undefined;
      const brands = await this.service.getAll(search);
      res.status(200).json(brands);
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
      const brand = await this.service.getById(req.params.id);
      res.status(200).json(brand);
    } catch (err) {
      next(err);
    }
  }

  // Recherche une marque par nom exact, la crée si elle n'existe pas encore
  async create(
    req: AuthenticatedRequest & { body: CreateBrand },
    res: Response,
    next: NextFunction,
  ) {
    try {
      const result = createBrandSchema.safeParse(req.body);
      if (!result.success) throw new BadRequestError(result.error.message);
      const brand = await this.service.findOrCreate(result.data, req.user.role);
      res.status(201).json(brand);
    } catch (err) {
      next(err);
    }
  }

  async update(
    req: RequestWithParams<{ id: string }> & { body: UpdateBrand },
    res: Response,
    next: NextFunction,
  ) {
    try {
      const result = updateBrandSchema.safeParse(req.body);
      if (!result.success) throw new BadRequestError(result.error.message);
      const brand = await this.service.update(
        req.params.id,
        result.data,
        req.user.role,
      );
      res.status(200).json(brand);
    } catch (err) {
      next(err);
    }
  }

  async delete(
    req: RequestWithParams<{ id: string }>,
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
