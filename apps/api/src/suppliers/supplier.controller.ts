import type { Request, Response, NextFunction } from "express";
import type { RequestWithParams } from "@api/middlewares";
import { BadRequestError } from "@api/errors";
import {
  createSupplierSchema,
  updateSupplierSchema,
  createSupplierProductSchema,
  updateSupplierProductSchema,
  type CreateSupplier,
  type UpdateSupplier,
  type CreateSupplierProduct,
  type UpdateSupplierProduct,
} from "@armali/schemas";
import { SupplierService } from "./supplier.service";

export class SupplierController {
  constructor(private service: SupplierService) {}

  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const suppliers = await this.service.getAll(req.user!.role);
      res.status(200).json(suppliers);
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
      const supplier = await this.service.getById(req.user!.role, req.params.id);
      res.status(200).json(supplier);
    } catch (err) {
      next(err);
    }
  }

  async create(
    req: Request & { body: CreateSupplier },
    res: Response,
    next: NextFunction,
  ) {
    try {
      const result = createSupplierSchema.safeParse(req.body);
      if (!result.success) throw new BadRequestError(result.error.message);
      const supplier = await this.service.create(req.user!.role, result.data);
      res.status(201).json(supplier);
    } catch (err) {
      next(err);
    }
  }

  async update(
    req: RequestWithParams<{ id: string }> & { body: UpdateSupplier },
    res: Response,
    next: NextFunction,
  ) {
    try {
      const result = updateSupplierSchema.safeParse(req.body);
      if (!result.success) throw new BadRequestError(result.error.message);
      const supplier = await this.service.update(
        req.user!.role,
        req.params.id,
        result.data,
      );
      res.status(200).json(supplier);
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
      await this.service.delete(req.user!.role, req.params.id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }

  // ── SupplierProduct ───────────────────────────────────────────────────────

  async addProduct(
    req: RequestWithParams<{ id: string }> & { body: CreateSupplierProduct },
    res: Response,
    next: NextFunction,
  ) {
    try {
      const result = createSupplierProductSchema.safeParse(req.body);
      if (!result.success) throw new BadRequestError(result.error.message);
      const link = await this.service.addProduct(
        req.user!.role,
        req.params.id,
        result.data,
      );
      res.status(201).json(link);
    } catch (err) {
      next(err);
    }
  }

  async updateProduct(
    req: RequestWithParams<{ id: string; productLinkId: string }> & {
      body: UpdateSupplierProduct;
    },
    res: Response,
    next: NextFunction,
  ) {
    try {
      const result = updateSupplierProductSchema.safeParse(req.body);
      if (!result.success) throw new BadRequestError(result.error.message);
      const link = await this.service.updateProduct(
        req.user!.role,
        req.params.id,
        req.params.productLinkId,
        result.data,
      );
      res.status(200).json(link);
    } catch (err) {
      next(err);
    }
  }

  async removeProduct(
    req: RequestWithParams<{ id: string; productLinkId: string }>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      await this.service.removeProduct(
        req.user!.role,
        req.params.id,
        req.params.productLinkId,
      );
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
}