import type { Request, Response, NextFunction } from "express";
import type { RequestWithParams } from "@api/middlewares";
import { BadRequestError } from "@api/errors";
import {
  createSupplierOrderSchema,
  type CreateSupplierOrder,
} from "@armali/schemas";
import { SupplierOrderService } from "./supplier-order.service";

export class SupplierOrderController {
  constructor(private service: SupplierOrderService) {}

  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const status = req.query.status as string | undefined;
      const orders = await this.service.getAll(
        req.user!.id,
        req.user!.role,
        status,
      );
      res.status(200).json(orders);
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
      const order = await this.service.getById(
        req.user!.id,
        req.user!.role,
        req.params.id,
      );
      res.status(200).json(order);
    } catch (err) {
      next(err);
    }
  }

  async create(
    req: Request & { body: CreateSupplierOrder },
    res: Response,
    next: NextFunction,
  ) {
    try {
      const result = createSupplierOrderSchema.safeParse(req.body);
      if (!result.success) throw new BadRequestError(result.error.message);
      const order = await this.service.create(
        req.user!.id,
        req.user!.role,
        result.data,
      );
      res.status(201).json(order);
    } catch (err) {
      next(err);
    }
  }

  async markReceived(
    req: RequestWithParams<{ id: string }>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const order = await this.service.markReceived(
        req.user!.id,
        req.user!.role,
        req.params.id,
      );
      res.status(200).json(order);
    } catch (err) {
      next(err);
    }
  }

  async cancel(
    req: RequestWithParams<{ id: string }>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const order = await this.service.cancel(
        req.user!.id,
        req.user!.role,
        req.params.id,
      );
      res.status(200).json(order);
    } catch (err) {
      next(err);
    }
  }
}