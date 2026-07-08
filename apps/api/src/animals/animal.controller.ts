import type { NextFunction, Response } from "express";
import type { AuthenticatedRequest, RequestWithParams } from "@api/middlewares";
import {
  animalDetailSchema,
  animalWithRaceMetaSchema,
  vaccineMetaSchema,
  type CreateAnimal,
  type UpdateAnimal,
} from "@armali/schemas";
import { AnimalService } from "./animal.service";

export class AnimalController {
  constructor(private service: AnimalService) {}

  async getAll(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const pets = await this.service.getAll({
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
      const pet = await this.service.getById({
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
      const pet = await this.service.create({
        data: req.body,
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
      const pet = await this.service.update({
        id: req.params.id,
        data: req.body,
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
      await this.service.delete({
        id: req.params.id,
        userId: req.user.id,
      });
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }

  async getByUser(
    req: RequestWithParams<{ id: string }>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const pets = await this.service.getByUser({
        targetUserId: req.params.id,
        requesterId: req.user.id,
        role: req.user.role,
      });
      res.status(200).json(animalWithRaceMetaSchema.array().parse(pets));
    } catch (err) {
      next(err);
    }
  }

  async getVaccines(
    req: RequestWithParams<{ id: string }>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const vaccines = await this.service.getVaccinesByAnimal(req.params.id);
      res.status(200).json(vaccineMetaSchema.array().parse(vaccines));
    } catch (err) {
      next(err);
    }
  }
}
