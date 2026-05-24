import type { NextFunction, Response } from "express";
import { AuthenticatedRequest, RequestWithParams } from "@api/middlewares";
import {
  animalMeetigWithMeetingSchema,
  animalMeetingActSchema,
  animalMeetingFieldSchema,
  animalMeetingSchema,
  ClientId,
  clinicActSchema,
  CreateAnimalMeeting,
  meetingBaseSchema,
  OwnedPetId,
  ownedPetWithRaceMeta,
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
            .extend({ ownedPet: ownedPetWithRaceMeta })
            .array()
            .parse(meetings),
        );
    } catch (err) {
      next(err);
    }
  }

  async getByAnimal(
    req: RequestWithParams<{ id: OwnedPetId }>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const meetings = await animalMeetingService.getByAnimal({
        ownedPetId: req.params.id,
        userId: req.user.id,
        role: req.user.role,
      });
      res.status(200).json(
        animalMeetingFieldSchema
          .extend({
            meeting: meetingBaseSchema,
            animalMeetingActs: animalMeetingActSchema.array(),
          })
          .array()
          .parse(meetings),
      );
    } catch (err) {
      next(err);
    }
  }
}
