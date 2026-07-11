import type { Request, Response, NextFunction } from "express";
import type { RequestWithParams } from "@api/middlewares";
import { BadRequestError } from "@api/errors";
import {
  checkoutSchema,
  deliverOrderSchema,
  type Checkout,
  type DeliverOrder,
} from "@armali/schemas";
import { OrderService } from "./order.service";

export class OrderController {
  constructor(private service: OrderService) {}

  async checkout(
    req: Request & { body: Checkout },
    res: Response,
    next: NextFunction,
  ) {
    try {
      const result = checkoutSchema.safeParse(req.body);
      if (!result.success) throw new BadRequestError(result.error.message);
      const checkoutResult = await this.service.checkout(
        req.user!.id,
        result.data,
      );
      res.status(201).json(checkoutResult);
    } catch (err) {
      next(err);
    }
  }

  async getMyOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const orders = await this.service.getMyOrders(req.user!.id);
      res.status(200).json(orders);
    } catch (err) {
      next(err);
    }
  }

  async getOrderById(
    req: RequestWithParams<{ id: string }>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const order = await this.service.getOrderById(
        req.user!.id,
        req.params.id,
      );
      res.status(200).json(order);
    } catch (err) {
      next(err);
    }
  }

  // ── Côté secrétaire ──────────────────────────────────────────────────────

  async getClinicOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const orders = await this.service.getClinicPendingOrders(req.user!.id);
      res.status(200).json(orders);
    } catch (err) {
      next(err);
    }
  }

  async markReady(
    req: RequestWithParams<{ id: string }>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      await this.service.markOrderReady(req.user!.id, req.params.id);
      res.status(200).json({ success: true });
    } catch (err) {
      next(err);
    }
  }

  async deliver(
    req: Request & { body: DeliverOrder },
    res: Response,
    next: NextFunction,
  ) {
    try {
      const result = deliverOrderSchema.safeParse(req.body);
      if (!result.success) throw new BadRequestError(result.error.message);
      const order = await this.service.deliverOrder(
        req.user!.id,
        result.data.pickupCode,
      );
      res.status(200).json(order);
    } catch (err) {
      next(err);
    }
  }
}
