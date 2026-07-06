import type { NextFunction, Response } from "express";
import type {
  AuthenticatedRequest,
  RequestWithParams,
} from "@api/middlewares";
import { BadRequestError } from "@api/errors";
import {
  createProductSchema,
  updateProductSchema,
  createProductClinicSchema,
  updateProductClinicSchema,
  restockProductClinicSchema,
  type CreateProduct,
  type UpdateProduct,
  type CreateProductClinic,
  type UpdateProductClinic,
  type RestockProductClinic,
} from "@armali/schemas";
import { ProductService } from "./product.service";

export class ProductController {
  constructor(private service: ProductService) {}

  // ── Products (catalogue global) ─────────────────────────────────────────

  async getAll(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const products = await this.service.getAll();
      res.status(200).json(products);
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
      const product = await this.service.getById(req.params.id);
      res.status(200).json(product);
    } catch (err) {
      next(err);
    }
  }

  async create(
    req: AuthenticatedRequest & { body: CreateProduct },
    res: Response,
    next: NextFunction,
  ) {
    try {
      const result = createProductSchema.safeParse(req.body);
      if (!result.success) throw new BadRequestError(result.error.message);
      const product = await this.service.create(result.data, req.user.role);
      res.status(201).json(product);
    } catch (err) {
      next(err);
    }
  }

  async update(
    req: RequestWithParams<{ id: string }> & { body: UpdateProduct },
    res: Response,
    next: NextFunction,
  ) {
    try {
      const result = updateProductSchema.safeParse(req.body);
      if (!result.success) throw new BadRequestError(result.error.message);
      const product = await this.service.update(
        req.params.id,
        result.data,
        req.user.role,
      );
      res.status(200).json(product);
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

  // ── ProductClinic (stock par clinique) ────────────────────────────────────

  async getClinicProducts(
    req: RequestWithParams<{ clinicId: string }>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const products = await this.service.getClinicProducts(
        req.params.clinicId,
      );
      res.status(200).json(products);
    } catch (err) {
      next(err);
    }
  }

  async getClinicProductById(
    req: RequestWithParams<{ id: string }>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const product = await this.service.getClinicProductById(
        req.params.id,
      );
      res.status(200).json(product);
    } catch (err) {
      next(err);
    }
  }

  async createClinicProduct(
    req: AuthenticatedRequest & { body: CreateProductClinic },
    res: Response,
    next: NextFunction,
  ) {
    try {
      const result = createProductClinicSchema.safeParse(req.body);
      if (!result.success) throw new BadRequestError(result.error.message);
      const product = await this.service.createClinicProduct(
        result.data,
        req.user.role,
      );
      res.status(201).json(product);
    } catch (err) {
      next(err);
    }
  }

  async updateClinicProduct(
    req: RequestWithParams<{ id: string }> & { body: UpdateProductClinic },
    res: Response,
    next: NextFunction,
  ) {
    try {
      const result = updateProductClinicSchema.safeParse(req.body);
      if (!result.success) throw new BadRequestError(result.error.message);
      const product = await this.service.updateClinicProduct(
        req.params.id,
        result.data,
        req.user.role,
      );
      res.status(200).json(product);
    } catch (err) {
      next(err);
    }
  }

  async restockClinicProduct(
    req: RequestWithParams<{ id: string }> & { body: RestockProductClinic },
    res: Response,
    next: NextFunction,
  ) {
    try {
      const result = restockProductClinicSchema.safeParse(req.body);
      if (!result.success) throw new BadRequestError(result.error.message);
      const product = await this.service.restockClinicProduct(
        req.params.id,
        result.data,
        req.user.role,
      );
      res.status(200).json(product);
    } catch (err) {
      next(err);
    }
  }

  async deleteClinicProduct(
    req: RequestWithParams<{ id: string }>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      await this.service.deleteClinicProduct(req.params.id, req.user.role);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
}