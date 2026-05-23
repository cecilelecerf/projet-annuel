import type { NextFunction, Response } from "express";
import type { AuthenticatedRequest, RequestWithParams } from "@api/middlewares";
import { BadRequestError } from "@api/errors";
import {
  createAnimalMeetingActSchema,
  updateAnimalMeetingActSchema,
  type CreateAnimalMeetingAct,
  type UpdateAnimalMeetingAct,
} from "@armali/schemas";
import { AnimalMeetingActService } from "./animal-meeting-act.service";

const service = new AnimalMeetingActService();

export class AnimalMeetingActController {
  async getByMeeting(
    req: RequestWithParams<{ meetingId: string }>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const acts = await service.getByMeeting(req.params.meetingId);
      console.log(acts);
      res.status(200).json(acts);
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
      const act = await service.getById(req.params.id);
      res.status(200).json(act);
    } catch (err) {
      next(err);
    }
  }

  async create(
    req: AuthenticatedRequest & { body: CreateAnimalMeetingAct },
    res: Response,
    next: NextFunction,
  ) {
    try {
      const result = createAnimalMeetingActSchema.safeParse(req.body);
      if (!result.success) throw new BadRequestError(result.error.message);
      const act = await service.create(result.data, req.user.role);
      res.status(201).json(act);
    } catch (err) {
      next(err);
    }
  }

  async update(
    req: RequestWithParams<{ id: string }> & { body: UpdateAnimalMeetingAct },
    res: Response,
    next: NextFunction,
  ) {
    try {
      const result = updateAnimalMeetingActSchema.safeParse(req.body);
      if (!result.success) throw new BadRequestError(result.error.message);
      const act = await service.update(
        req.params.id,
        result.data,
        req.user.role,
      );
      res.status(200).json(act);
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
      await service.delete(req.params.id, req.user.role);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
}
