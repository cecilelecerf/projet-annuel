import type { Request, Response, NextFunction } from "express";
import type { RequestWithParams } from "@api/middlewares";
import { animalOptionSchema, productRecommendationSchema } from "@armali/schemas";
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

  async getAnimals(req: Request, res: Response, next: NextFunction) {
    try {
      const animals = await this.service.getAnimals(req.user!.id);
      res.status(200).json(animalOptionSchema.array().parse(animals));
    } catch (err) {
      next(err);
    }
  }

  async getFoodRecommendations(
    req: RequestWithParams<{ animalId: string }>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const recommendations = await this.service.getFoodRecommendations(
        req.user!.id,
        req.params.animalId,
      );
      res.status(200).json(productRecommendationSchema.array().parse(recommendations));
    } catch (err) {
      next(err);
    }
  }
}