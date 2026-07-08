import type { NextFunction, Response } from "express";
import type { AuthenticatedRequest, RequestWithParams } from "@api/middlewares";
import { BadRequestError } from "@api/errors";
import {
  AnimalId,
  createMedicalHistorySchema,
  createMeetingMedicalHistorySchema,
  fileWithUrlSchema,
  medicalHistoryMetaSchema,
  medicalHistorySchema,
  MeetingId,
  updateMedicalHistorySchema,
  type CreateMettingMedicalHistory,
  type UpdateMedicalHistory,
} from "@armali/schemas";
import { AnimalMedicalHistoryService } from "./medical-history.service";

export class AnimalMedicalHistoryController {
  constructor(private service: AnimalMedicalHistoryService) {}

  async getByMeeting(
    req: RequestWithParams<{ id: MeetingId }>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const acts = await this.service.getByMeeting(
        req.params.id,
        req.user.role,
        req.user.id,
      );
      res.status(200).json(medicalHistoryMetaSchema.array().parse(acts));
    } catch (err) {
      next(err);
    }
  }

  async getByAnimal(
    req: RequestWithParams<{ id: AnimalId }>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const acts = await this.service.getByAnimal(
        req.params.id,
        req.user.role,
        req.user.id,
      );
      console.log(acts);
      res.status(200).json(medicalHistoryMetaSchema.array().parse(acts));
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
      const acts = await this.service.getByClinic(
        req.params.id,
        req.user.role,
        req.user.id,
      );
      res.status(200).json(medicalHistorySchema.array().parse(acts));
    } catch (err) {
      next(err);
    }
  }

  async create(
    req: AuthenticatedRequest & { body: CreateMettingMedicalHistory },
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
      res.status(201).json(medicalHistorySchema.parse(act));
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
      console.log(updateMedicalHistorySchema);
      if (!result.success) throw new BadRequestError(result.error.message);
      const act = await this.service.update(
        req.params.id,
        result.data,
        req.user.role,
        req.user.id,
      );
      res.status(200).json(medicalHistorySchema.parse(act));
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
      await this.service.delete(req.params.id, req.user.role, req.user.id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }

  async getFiles(
    req: RequestWithParams<{ id: string }> & AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const files = await this.service.getFiles(
        req.params.id,
        req.user.role,
        req.user.id,
      );
      res.status(200).json(fileWithUrlSchema.array().parse(files));
    } catch (err) {
      next(err);
    }
  }

  async createFileUpload(
    req: RequestWithParams<{ id: string }> &
      AuthenticatedRequest & { body: { mimeType: string } },
    res: Response,
    next: NextFunction,
  ) {
    try {
      const result = await this.service.createFileUpload(
        req.params.id,
        req.body.mimeType,
        req.user.role,
        req.user.id,
      );
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }

  async confirmFileUpload(
    req: RequestWithParams<{ id: string; fileId: string }> &
      AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const file = await this.service.confirmFileUpload(
        req.params.id,
        req.params.fileId,
        req.user.role,
        req.user.id,
      );
      res.status(200).json(fileWithUrlSchema.parse(file));
    } catch (err) {
      next(err);
    }
  }
}
