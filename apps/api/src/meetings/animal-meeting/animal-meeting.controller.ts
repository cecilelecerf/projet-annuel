import type { NextFunction, Response } from "express";
import { AuthenticatedRequest, RequestWithParams } from "@api/middlewares";
import {
  animalMeetigWithMeetingSchema,
  medicalHistorySchema,
  animalMeetingFieldSchema,
  animalMeetingSchema,
  ClientId,
  clinicActSchema,
  CreateAnimalMeeting,
  meetingBaseSchema,
  AnimalId,
  animalWithRaceMeta,
  UpdateAnimalMeeting,
} from "@armali/schemas";
import { AnimalMeetingService } from "./animal-meeting.service";
import { ForbiddenError } from "@api/errors";

const animalMeetingService = new AnimalMeetingService();
export class AnimalMeetingController {
  async create(
    req: AuthenticatedRequest & { body: CreateAnimalMeeting },
    res: Response,
    next: NextFunction,
  ) {
    try {
      if (!req.user.clinicId) throw new ForbiddenError();
      const meeting = await animalMeetingService.create({
        data: req.body,
        clinicId: req.user.clinicId,
      });
      res.status(201).json(meeting);
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
      const meeting = await animalMeetingService.getById({
        id: req.params.id,
        userId: req.user.id,
        role: req.user.role,
      });
      res.status(200).json(meeting);
    } catch (err) {
      next(err);
    }
  }

  async update(
    req: RequestWithParams<{ id: string }> & { body: UpdateAnimalMeeting },
    res: Response,
    next: NextFunction,
  ) {
    try {
      const meeting = await animalMeetingService.update({
        id: req.params.id,
        data: req.body,
        userId: req.user.id,
      });
      res.status(200).json(animalMeetigWithMeetingSchema.parse(meeting));
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
      await animalMeetingService.delete({
        id: req.params.id,
        userId: req.user.id,
        role: req.user.role,
      });
      res.status(204).json();
    } catch (err) {
      next(err);
    }
  }

  async getByClient(
    req: RequestWithParams<{ id: ClientId }>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const meetings = await animalMeetingService.getByClient({
        id: req.params.id,
        userId: req.user.id,
        role: req.user.role,
      });
      res
        .status(200)
        .json(
          animalMeetigWithMeetingSchema
            .extend({ animal: animalWithRaceMeta })
            .array()
            .parse(meetings),
        );
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
      const meetings = await animalMeetingService.getByAnimal({
        animalId: req.params.id,
        userId: req.user.id,
        role: req.user.role,
      });
      console.log(meetings);
      res.status(200).json(
        animalMeetingFieldSchema
          .extend({
            meeting: meetingBaseSchema,
            animalMedicalHistories: medicalHistorySchema.array(),
          })
          .array()
          .parse(meetings),
      );
    } catch (err) {
      next(err);
    }
  }
}
