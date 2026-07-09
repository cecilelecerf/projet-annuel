import type { Request, Response, NextFunction } from "express";
import type { RequestWithParams } from "@api/middlewares";
import { ClientShopService } from "./shop.service";

export class ClientShopController {
  constructor(private service: ClientShopService) {}

  async getProducts(req: Request, res: Response, next: NextFunction) {
    try {
      const products = await this.service.getProducts(req.user!.id);
      res.status(200).json(products);
    } catch (err) {
      next(err);
    }
  }

  async getProductById(
    req: RequestWithParams<{ id: string }>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const product = await this.service.getProductById(
        req.user!.id,
        req.params.id,
      );
      res.status(200).json(product);
    } catch (err) {
      next(err);
    }
  }
}