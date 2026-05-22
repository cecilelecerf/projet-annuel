import type { NextFunction, Response } from "express";
import type { AuthenticatedRequest, RequestWithParams } from "@api/middlewares";
import { type CreateOwnedPet, type UpdateOwnedPet } from "@armali/schemas";
import { OwnedPetService } from "./owned-pet.service";

const ownedPetService = new OwnedPetService();

export class OwnedPetController {
  async getAll(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const pets = await ownedPetService.getAll({
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
      const pet = await ownedPetService.getById({
        id: req.params.id,
        userId: req.user.id,
        role: req.user.role,
      });
      res.status(200).json(pet);
    } catch (err) {
      next(err);
    }
  }

  async create(
    req: AuthenticatedRequest & { body: CreateOwnedPet },
    res: Response,
    next: NextFunction,
  ) {
    try {
      const pet = await ownedPetService.create({
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
    req: RequestWithParams<{ id: string }> & { body: UpdateOwnedPet },
    res: Response,
    next: NextFunction,
  ) {
    try {
      const pet = await ownedPetService.update({
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
      await ownedPetService.delete({
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
      const pets = await ownedPetService.getByUser({
        targetUserId: req.params.userId,
        requesterId: req.user.id,
        role: req.user.role,
      });
      res.status(200).json(pets);
    } catch (err) {
      next(err);
    }
  }
}
