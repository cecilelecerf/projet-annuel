import type { NextFunction, Response } from "express";
import { AuthenticatedRequest, RequestWithParams } from "@api/middlewares";
import {
  animalMeetigWithMeetingSchema,
  medicalHistorySchema,
  animalMeetingFieldSchema,
  ClientId,
  CreateAnimalMeeting,
  meetingBaseSchema,
  AnimalId,
  UpdateAnimalMeeting,
} from "@armali/schemas";
import { AnimalMeetingService } from "./animal-meeting.service";
import { ForbiddenError } from "@api/errors";
import { flatUser } from "@api/users/user.utils";

export class AnimalMeetingController {
  constructor(private service: AnimalMeetingService) {}

  async create(
    req: AuthenticatedRequest & { body: CreateAnimalMeeting },
    res: Response,
    next: NextFunction,
  ) {
    try {
      const meeting = await this.service.create({
        data: req.body,
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
      const meeting = await this.service.getById({
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
      const meeting = await this.service.update({
        id: req.params.id,
        data: req.body,
        userId: req.user.id,
        role: req.user.role,
      });
      res.status(200).json(animalMeetingFieldSchema.parse(meeting));
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
      const meetings = await this.service.getByUser({
        id: req.params.id,
        userId: req.user.id,
        role: req.user.role,
      });
      console.log(
        meetings.map((meeting) => ({
          ...meeting,
          animal: {
            ...meeting.animal,
            client: flatUser(meeting.animal.client),
          },
          veterinarianClinic: {
            ...meeting.veterinarianClinic,
            veterinarian: flatUser(meeting.veterinarianClinic.veterinarian),
          },
        })),
      );
      res.status(200).json(
        animalMeetigWithMeetingSchema.array().parse(
          meetings.map((meeting) => ({
            ...meeting,
            animal: {
              ...meeting.animal,
              client: flatUser(meeting.animal.client),
            },
            veterinarianClinic: {
              ...meeting.veterinarianClinic,
              veterinarian: flatUser(meeting.veterinarianClinic.veterinarian),
            },
          })),
        ),
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
      const meetings = await this.service.getByAnimal({
        animalId: req.params.id,
        userId: req.user.id,
        role: req.user.role,
      });
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
