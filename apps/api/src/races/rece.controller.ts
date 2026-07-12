import type { NextFunction, Response } from "express";
import type { AuthenticatedRequest, RequestWithParams } from "@api/middlewares";
import { BadRequestError } from "@api/errors";
import {
  createRaceSchema,
  updateRaceSchema,
  raceSchema,
  type CreateRace,
  type UpdateRace,
  PetId,
  RaceId,
} from "@armali/schemas";
import { RaceService } from "./race.service";

export class RaceController {
  constructor(private service: RaceService) {}

  async getByPetId(
    req: RequestWithParams<{ id: PetId }>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const races = await this.service.getByPetId(req.params.id);
      res.status(200).json(raceSchema.array().parse(races));
    } catch (err) {
      next(err);
    }
  }

  async getById(
    req: RequestWithParams<{ id: RaceId }>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const race = await this.service.getById(req.params.id);
      res.status(200).json(raceSchema.parse(race));
    } catch (err) {
      next(err);
    }
  }

  async create(
    req: AuthenticatedRequest & { body: CreateRace },
    res: Response,
    next: NextFunction,
  ) {
    try {
      const result = createRaceSchema.safeParse(req.body);
      if (!result.success) throw new BadRequestError(result.error.message);
      const race = await this.service.create(result.data, req.user.role);
      res.status(201).json(raceSchema.parse(race));
    } catch (err) {
      next(err);
    }
  }

  async update(
    req: RequestWithParams<{ id: RaceId }> &
      AuthenticatedRequest & { body: UpdateRace },
    res: Response,
    next: NextFunction,
  ) {
    try {
      const result = updateRaceSchema.safeParse(req.body);
      if (!result.success) throw new BadRequestError(result.error.message);
      const race = await this.service.update(
        req.params.id,
        result.data,
        req.user.role,
      );
      res.status(200).json(raceSchema.parse(race));
    } catch (err) {
      next(err);
    }
  }

  async delete(
    req: RequestWithParams<{ id: RaceId }> & AuthenticatedRequest,
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
