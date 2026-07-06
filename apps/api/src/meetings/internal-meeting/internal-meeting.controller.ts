import type { NextFunction, Response } from "express";
import { AuthenticatedRequest, RequestWithParams } from "@api/middlewares";
import { BadRequestError, ForbiddenError } from "@api/errors";
import {
  CreateInternalMeeting,
  deleteInternalMeetingQuerySchema,
  UpdateInternalMeeting,
  updateParticipantStatusSchema,
} from "@armali/schemas";
import { InternalMeetingService } from "./internal-meeting.service";

export class InternalMeetingController {
  constructor(private service: InternalMeetingService) {}

  async create(
    req: AuthenticatedRequest & { body: CreateInternalMeeting },
    res: Response,
    next: NextFunction,
  ) {
    try {
      if (!req.user.clinicId) throw new ForbiddenError();

      const meeting = await this.service.create({
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
    const result = deleteInternalMeetingQuerySchema.safeParse(req.query);
    if (!result.success) throw new BadRequestError(result.error.message);
    try {
      const meeting = await this.service.update({
        id: req.params.id,
        data: req.body,
        userId: req.user.id,
        scope: result.data.scope,
        date: result.data.date,
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
      const result = deleteInternalMeetingQuerySchema.safeParse(req.query);
      if (!result.success) throw new BadRequestError(result.error.message);

      await this.service.delete({
        id: req.params.id,
        userId: req.user.id,
        scope: result.data.scope,
        date: result.data.date,
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

      const participant = await this.service.updateParticipantStatus({
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
