import type { Response, NextFunction } from "express";
import { RecurringService } from "./recurring-meeting.service";
import { meetingRecurringSchema, UpdateRecurring } from "@armali/schemas";
import { RequestWithParams } from "@api/middlewares";

export class RecurringMeetingController {
  constructor(private service: RecurringService) {}

  async getRecurring(
    req: RequestWithParams<{ id: string }>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const recurring = await this.service.getById(req.params.id);
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
      const updated = await this.service.update({
        id: req.params.id,
        data: req.body,
      });
      res.json(meetingRecurringSchema.parse(updated));
    } catch (err) {
      next(err);
    }
  }
}
