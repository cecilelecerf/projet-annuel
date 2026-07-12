import type { NextFunction, Response } from "express";
import type { AuthenticatedRequest, RequestWithParams } from "@api/middlewares";
import { BadRequestError } from "@api/errors";
import {
  createPetSchema,
  updatePetSchema,
  petSchema,
  type CreatePet,
  type UpdatePet,
  PetId,
} from "@armali/schemas";
import { PetService } from "./pet.service";

export class PetController {
  constructor(private service: PetService) {}

  async getAll(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const pets = await this.service.getAll();
      res.status(200).json(petSchema.array().parse(pets));
    } catch (err) {
      next(err);
    }
  }

  async getById(
    req: RequestWithParams<{ id: PetId }>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const pet = await this.service.getById(req.params.id);
      res.status(200).json(petSchema.parse(pet));
    } catch (err) {
      next(err);
    }
  }

  async create(
    req: AuthenticatedRequest & { body: CreatePet },
    res: Response,
    next: NextFunction,
  ) {
    try {
      const result = createPetSchema.safeParse(req.body);
      if (!result.success) throw new BadRequestError(result.error.message);
      const pet = await this.service.create(result.data, req.user.role);
      res.status(201).json(petSchema.parse(pet));
    } catch (err) {
      next(err);
    }
  }

  async update(
    req: RequestWithParams<{ id: PetId }> &
      AuthenticatedRequest & { body: UpdatePet },
    res: Response,
    next: NextFunction,
  ) {
    try {
      const result = updatePetSchema.safeParse(req.body);
      if (!result.success) throw new BadRequestError(result.error.message);
      const pet = await this.service.update(
        req.params.id,
        result.data,
        req.user.role,
      );
      res.status(200).json(petSchema.parse(pet));
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
