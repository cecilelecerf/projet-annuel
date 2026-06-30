import type { NextFunction, Response } from "express";
import { AuthenticatedRequest, RequestWithParams } from "@api/middlewares";
import { BadRequestError, ForbiddenError } from "@api/errors";
import {
  CreateInternalMeeting,
  UpdateInternalMeeting,
  updateParticipantStatusSchema,
} from "@armali/schemas";
import { InternalMeetingService } from "./internal-meeting.service";
import { prisma } from "@api/lib/prisma";
import { InternalMeetingRepository } from "./internal-meeting.repository";
const internalMeetingRepository = new InternalMeetingRepository(prisma);

const internalMeetingService = new InternalMeetingService(
  internalMeetingRepository,
);

export class InternalMeetingController {
  async create(
    req: AuthenticatedRequest & { body: CreateInternalMeeting },
    res: Response,
    next: NextFunction,
  ) {
    console.log("enter");
    try {
      if (!req.user.clinicId) throw new ForbiddenError();

      const meeting = await internalMeetingService.create({
        data: req.body,
        userId: req.user.id,
        clinicId: req.user.clinicId,
      });
      res.status(201).json(meeting);
    } catch (err) {
      next(err);
    }
  }

  async update(
    req: RequestWithParams<{ id: string }> & { body: UpdateInternalMeeting },
    res: Response,
    next: NextFunction,
  ) {
    try {
      const meeting = await internalMeetingService.update({
        id: req.params.id,
        data: req.body,
        userId: req.user.id,
      });
      res.status(200).json(meeting);
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
      await internalMeetingService.delete({
        id: req.params.id,
        userId: req.user.id,
      });
      res.status(204).json();
    } catch (err) {
      next(err);
    }
  }

  async updateParticipantStatus(
    req: RequestWithParams<{ id: string; userId: string }>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const result = updateParticipantStatusSchema.safeParse(req.body);
      if (!result.success) throw new BadRequestError(result.error.message);

      const participant = await internalMeetingService.updateParticipantStatus({
        meetingId: req.params.id,
        userId: req.user.id,
        status: result.data.status,
        date: result.data.date,
        scope: result.data.scope,
      });
      res.status(200).json(participant);
    } catch (err) {
      next(err);
    }
  }
}
