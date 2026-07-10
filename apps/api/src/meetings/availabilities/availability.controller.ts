import type { NextFunction, Response } from "express";
import { AuthenticatedRequest, RequestWithParams } from "@api/middlewares";
import {
  availabilityResponseSchema,
  availabilityTimelineSchema,
  clinicIdSchema,
  CreateAvailability,
  VeterinarianId,
} from "@armali/schemas";
import { AvailabilityService } from "./availability.service";
import { BadRequestError, ForbiddenError, NotFoundError } from "@api/errors";
import dayjs from "dayjs";
import z from "zod";

export class AvailabilityController {
  constructor(private service: AvailabilityService) {}

  async getAllByUser(
    req: RequestWithParams<{ date?: string }>,
    res: Response,
    _next: NextFunction,
  ) {
    const dateParam =
      typeof req.query.date === "string" ? req.query.date : undefined;

    const availabilities = await this.service.getAll({
      userId: req.user.id,
      date: dateParam ? dayjs(dateParam).toDate() : dayjs().toDate(),
    });
    res.status(200).json(
      availabilityResponseSchema.array().parse(
        availabilities.map((availability) => ({
          ...availability,
          type: availability.recurringId ? "RECURRING" : "PUNCTUAL",
        })),
      ),
    );
  }

  async create(
    req: AuthenticatedRequest & { body: CreateAvailability },
    res: Response,
    next: NextFunction,
  ) {
    try {
      if (!req.user.clinicId) throw new ForbiddenError();
      const availability = await this.service.create({
        data: req.body,
        authorId: req.user.id,
        clinicId: req.user.clinicId,
      });
      res.status(201).json(availability);
    } catch (err) {
      next(err);
    }
  }

  async update(
    req: RequestWithParams<{ id: string }>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const availability = await this.service.update({
        id: req.params.id,
        data: req.body,
        userId: req.user.id,
        role: req.user.role,
      });
      res.status(200).json(availability);
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
      if (!req.user.clinicId) throw new ForbiddenError();
      // TODO : vérificaiton author travail bien dans la clinic
      await this.service.delete({
        id: req.params.id,
        authorId: req.user.id,
      });
      res.status(204).json();
    } catch (err) {
      next(err);
    }
  }

  async getAvailabilityTimeline(
    req: RequestWithParams<{ id: VeterinarianId }>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const result = z.object({ date: z.coerce.date() }).safeParse(req.query);
      if (!result.success)
        throw new BadRequestError("La date et la clinic sont requis");

      const { date } = result.data;
      const { id: veterinarianId } = req.params;

      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const timeline = await this.service.getAvailabilityTimeline({
        veterinarianId: veterinarianId,
        start: startOfDay,
        end: endOfDay,
        userId: req.user.id,
        role: req.user.role,
      });

      return res.status(200).json(availabilityTimelineSchema.parse(timeline));
    } catch (err) {
      next(err);
    }
  }
}
