import type { NextFunction, Response } from "express";
import type { AuthenticatedRequest, RequestWithParams } from "@api/middlewares";
import { BadRequestError } from "@api/errors";
import {
  createMedicalHistorySchema,
  MeetingId,
  updateMedicalHistorySchema,
  type CreateMedicalHistory,
  type UpdateMedicalHistory,
} from "@armali/schemas";
import { AnimalMedicalHistoryService } from "./medical-history.service";

export class AnimalMedicalHistoryController {
  constructor(private service: AnimalMedicalHistoryService) {}

  async getByMeeting(
    req: RequestWithParams<{ meetingId: MeetingId }>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const acts = await this.service.getByMeeting(req.params.meetingId);
      res.status(200).json(acts);
    } catch (err) {
      next(err);
    }
  }
  async getByClinic(
    req: RequestWithParams<{ id: string }>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const acts = await this.service.getByClinic(req.params.id);
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
      const act = await this.service.getById(req.params.id);
      res.status(200).json(act);
    } catch (err) {
      next(err);
    }
  }

  async create(
    req: AuthenticatedRequest & { body: CreateMedicalHistory },
    res: Response,
    next: NextFunction,
  ) {
    try {
      const result = createMedicalHistorySchema.safeParse(req.body);
      if (!result.success) throw new BadRequestError(result.error.message);
      const act = await this.service.create(
        result.data,
        req.user.role,
        req.user.id,
      );
      res.status(201).json(act);
    } catch (err) {
      next(err);
    }
  }

  async update(
    req: RequestWithParams<{ id: string }> & { body: UpdateMedicalHistory },
    res: Response,
    next: NextFunction,
  ) {
    try {
      const result = updateMedicalHistorySchema.safeParse(req.body);
      if (!result.success) throw new BadRequestError(result.error.message);
      const act = await this.service.update(
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
      await this.service.delete(req.params.id, req.user.role);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
}
