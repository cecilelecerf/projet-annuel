import type { Request, Response, NextFunction } from "express";
import { RecurringService } from "./recurring-meeting.service";
import { RecurringRepository } from "./recurring-meeting.repository";
import { prisma } from "@api/lib/prisma";
import {
  meetingRecurringSchema,
  UpdateRecurring,
  updateRecurringSchema,
} from "@armali/schemas";
import { RequestWithParams } from "@api/middlewares";

const recurringRepository = new RecurringRepository(prisma);
const recurringService = new RecurringService(recurringRepository);
export class RecurringMeetingController {
  async getRecurring(
    req: RequestWithParams<{ id: string }>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const recurring = await recurringService.getById(req.params.id);
      res.json(meetingRecurringSchema.parse(recurring));
    } catch (err) {
      next(err);
    }
  }

  async patchRecurring(
    req: RequestWithParams<{ id: string }> & { body: UpdateRecurring },
    res: Response,
    next: NextFunction,
  ) {
    try {
      const updated = await recurringService.update(req.params.id, req.body);
      res.json(meetingRecurringSchema.parse(updated));
    } catch (err) {
      next(err);
    }
  }
}
