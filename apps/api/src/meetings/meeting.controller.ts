import {
  getPeriodQuerySchema,
  calendarSchema,
  availabilitiesSchema,
  animalMeetingMetaSchema,
  internalMeetingMetaSchema,
  bookingSlotSchema,
  clinicIdSchema,
  VeterinarianId,
  MeetingRecurringId,
  MeetingId,
} from "@armali/schemas";
import type { NextFunction, Response } from "express";
import { BadRequestError, NotFoundError } from "@api/errors";
import { AuthenticatedRequest, RequestWithParams } from "@api/middlewares";
import { MeetingService } from "./meeting.service";
import { AnimalMeetingService } from "./animal-meeting";
import { InternalMeetingService } from "./internal-meeting";
import { AvailabilityService } from "./availabilities";
import z from "zod";
import { RecurringService } from "./recurring-meeting/recurring-meeting.service";
import { MeetingBase } from "../../prisma/generated/prisma/client";

export class MeetingController {
  constructor(
    private service: MeetingService,
    private animalMeetingService: AnimalMeetingService,
    private availabilityService: AvailabilityService,
    private internalMeetingService: InternalMeetingService,
    private recurringMeetingService: RecurringService,
  ) {}

  async getMyCalendar(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const result = getPeriodQuerySchema.safeParse(req.query);
      if (!result.success)
        throw new BadRequestError("startDate et endDate sont requis");

      const { startDate: start, endDate: end } = result.data;
      const { id: userId, role } = req.user;

      const calendar = await this.service.getCalendar({
        userId,
        role,
        targetId: req.user.id,
        targetRole: req.user.role,
        start,
        end,
      });
      return res.status(200).json(calendarSchema.parse(calendar));
    } catch (err) {
      next(err);
    }
  }

  async getVeterinarianCalendar(
    req: RequestWithParams<{ id: VeterinarianId }>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const result = getPeriodQuerySchema.safeParse(req.query);
      if (!result.success)
        throw new BadRequestError("startDate et endDate sont requis");

      const { startDate: start, endDate: end } = result.data;

      const calendar = await this.service.getCalendar({
        userId: req.user.id,
        role: req.user.role,
        targetId: req.params.id,
        targetRole: "VETERINARIAN",
        start,
        end,
      });
      return res.status(200).json(calendarSchema.parse(calendar));
    } catch (err) {
      next(err);
    }
  }

  async getMeeting(
    req: RequestWithParams<{ id: MeetingRecurringId | MeetingId }> & {
      query: { date?: string };
    },
    res: Response,
    next: NextFunction,
  ) {
    try {
      const isRecurring = !!req.query.date;
      let meetingBase: MeetingBase;
      if (isRecurring) {
        const recurring = await this.recurringMeetingService.getById(
          req.params.id as MeetingRecurringId,
        );
        if (!recurring) throw new NotFoundError("Meeting");
        const date = new Date(req.query.date!);
        if (isNaN(date.getTime())) throw new BadRequestError("date invalide");
        meetingBase = {
          id: recurring.id as MeetingId,
          createdAt: recurring.createdAt,
          updatedAt: recurring.updatedAt,
          startTime: recurring.startTime,
          endTime: recurring.endTime,
          kind: recurring.kind,
          date: date,
          type: "SPECIFIED" as const,
          parentId: recurring.id as MeetingRecurringId,
        };
      } else {
        meetingBase = await this.service.getMeetingById(
          req.params.id as MeetingId,
        );
      }

      if (!meetingBase) throw new NotFoundError("Meeting");

      switch (meetingBase.kind) {
        case "ANIMAL": {
          const meeting = await this.animalMeetingService.getById({
            id: req.params.id,
            userId: req.user.id,
            role: req.user.role,
          });
          const data = { ...meeting, ...meetingBase };
          return res.status(200).json(animalMeetingMetaSchema.parse(data));
        }
        case "INTERNAL": {
          const meeting = await this.internalMeetingService.getById({
            id: req.params.id,
            role: req.user.role,
          });
          const data = { ...meeting, ...meetingBase };
          return res.status(200).json(internalMeetingMetaSchema.parse(data));
        }
        case "AVAILABILITY": {
          const meeting = await this.availabilityService.getById({
            id: req.params.id,
            userId: req.user.id,
            role: req.user.role,
          });
          const data = { ...meeting, ...meetingBase };

          return res.status(200).json(availabilitiesSchema.parse(data));
        }
        default:
          throw new NotFoundError("Meeting");
      }
    } catch (err) {
      next(err);
    }
  }

  async getVetSlots(
    req: RequestWithParams<{ id: VeterinarianId }>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const result = z
        .object({ date: z.coerce.date(), clinicId: clinicIdSchema })
        .safeParse(req.query);
      if (!result.success)
        throw new BadRequestError("La date et la clinic sont requis");

      const { date, clinicId } = result.data;

      const slots = await this.service.getVetSlots({
        veterinarianId: req.params.id,
        start: date,
        end: date,
        clinicIds: [clinicId],
      });
      return res.status(200).json(bookingSlotSchema.array().parse(slots));
    } catch (err) {
      next(err);
    }
  }
}
