import type { NextFunction, Response } from "express";
import type { AuthenticatedRequest, RequestWithParams } from "@api/middlewares";
import {
  animalDetailSchema,
  animalMetaSchema,
  animalWithRaceMeta,
  type CreateAnimal,
  type UpdateAnimal,
} from "@armali/schemas";
import { AnimalService } from "./animal.service";

const animalService = new AnimalService();

export class AnimalController {
  async getAll(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const pets = await animalService.getAll({
        userId: req.user.id,
        role: req.user.role,
      });
      res.status(200).json(pets);
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
      const pet = await animalService.getById({
        id: req.params.id,
        userId: req.user.id,
        role: req.user.role,
      });
      res.status(200).json(animalDetailSchema.parse(pet));
    } catch (err) {
      next(err);
    }
  }

  async create(
    req: AuthenticatedRequest & { body: CreateAnimal },
    res: Response,
    next: NextFunction,
  ) {
    try {
      const pet = await animalService.create({
        data: req.body.data,
        userId: req.user.id,
        role: req.user.role,
      });
      res.status(201).json(pet);
    } catch (err) {
      next(err);
    }
  }

  async update(
    req: RequestWithParams<{ id: string }> & { body: UpdateAnimal },
    res: Response,
    next: NextFunction,
  ) {
    try {
      const pet = await animalService.update({
        id: req.params.id,
        data: req.body.data,
        userId: req.user.id,
        role: req.user.role,
      });
      res.status(200).json(pet);
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
      await animalService.delete({
        id: req.params.id,
        userId: req.user.id,
        role: req.user.role,
      });
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }

  async getByUser(
    req: RequestWithParams<{ userId: string }>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const pets = await animalService.getByUser({
        targetUserId: req.params.userId,
        requesterId: req.user.id,
        role: req.user.role,
      });
      res.status(200).json(animalWithRaceMeta.array().parse(pets));
    } catch (err) {
      next(err);
    }
  }
}
