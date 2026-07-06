import type { NextFunction, Response } from "express";
import { AuthenticatedRequest, RequestWithParams } from "@api/middlewares";
import {
  availabilityResponseSchema,
  CreateAvailability,
} from "@armali/schemas";
import { AvailabilityService } from "./availability.service";
import { ForbiddenError } from "@api/errors";
import dayjs from "dayjs";

export class AvailabilityController {
  constructor(private service: AvailabilityService) {}

  async getAllByUser(
    req: RequestWithParams<{ date?: string }>,
    res: Response,
    next: NextFunction,
  ) {
    const availabilities = await this.service.getAll({
      userId: req.user.id,
      date: req.params.date
        ? dayjs(req.params.date).toDate()
        : dayjs().toDate(),
    });
    res.status(201).json(
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
}
