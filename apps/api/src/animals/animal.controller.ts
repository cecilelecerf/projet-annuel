import type { NextFunction, Response } from "express";
import { z } from "zod";
import type { AuthenticatedRequest, RequestWithParams } from "@api/middlewares";
import {
  animalDetailSchema,
  AnimalId,
  animalMetaSchema,
  animalWithRaceMetaSchema,
  ClinicId,
  fileIdSchema,
  uploadResponseSchema,
  UserId,
  vaccineMetaSchema,
  type CreateAnimal,
  type UpdateAnimal,
} from "@armali/schemas";
import { AnimalService } from "./animal.service";
import { paginationQuerySchema } from "../../../../packages/schemas/src/pagination.schema";

export class AnimalController {
  constructor(private service: AnimalService) {}

  async getAll(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const pets = await this.service.getAll({
        userId: req.user.id,
        role: req.user.role,
      });
      res.status(200).json(animalWithRaceMetaSchema.array().parse(pets));
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

  async getAllByUser(
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
      res.status(200).json(animalMetaSchema.array().parse(pets));
    } catch (err) {
      next(err);
    }
  }

  async getVaccines(
    req: RequestWithParams<{ id: AnimalId }>,
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

  async getByClinic(
    req: RequestWithParams<{ id: ClinicId }>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const paginations = paginationQuerySchema.parse(req.query);

      const animals = await this.service.getAnimalByClinic(
        req.user.role,
        req.user.id,
        req.params.id,
        paginations,
      );

      res.status(200).json(animalMetaSchema.array().parse(animals));
    } catch (err) {
      next(err);
    }
  }

  async uploadPhoto(
    req: RequestWithParams<{ id: string }>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { mimeType } = req.body;
      const result = await this.service.uploadPhoto({
        animalId: req.params.id,
        userId: req.user.id,
        role: req.user.role,
        mimeType,
      });
      res.json(uploadResponseSchema.parse(result));
    } catch (err) {
      next(err);
    }
  }

  async confirmPhoto(
    req: RequestWithParams<{ id: string }>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { fileId } = z.object({ fileId: fileIdSchema }).parse(req.body);
      const animal = await this.service.confirmPhotoUpload({
        animalId: req.params.id,
        userId: req.user.id,
        role: req.user.role,
        fileId,
      });
      res.json(animalWithRaceMetaSchema.parse(animal));
    } catch (err) {
      next(err);
    }
  }

  async getByVeterinarian(
    req: RequestWithParams<{ id: UserId }>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const paginations = paginationQuerySchema.parse(req.query);

      const animals = await this.service.getAnimalByVeterinarian(
        req.params.id ?? req.user.id,
        req.user.role,
        req.user.id,
        paginations,
      );
      res.status(200).json(animalMetaSchema.array().parse(animals));
    } catch (err) {
      next(err);
    }
  }
}
