import type { NextFunction, Response } from "express";
import { AuthenticatedRequest, RequestWithParams } from "@api/middlewares";
import { CreateAvailability } from "@armali/schemas";
import { AvailabilityService } from "./availability.service";

const availabilityService = new AvailabilityService();

export class AvailabilityController {
  async create(
    req: AuthenticatedRequest & { body: CreateAvailability },
    res: Response,
    next: NextFunction,
  ) {
    try {
      const availability = await availabilityService.create({
        data: req.body,
        userId: req.user.id,
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
      const availability = await availabilityService.update({
        id: req.params.id,
        data: req.body,
        userId: req.user.id,
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
      await availabilityService.delete({
        id: req.params.id,
        userId: req.user.id,
      });
      res.status(204).json();
    } catch (err) {
      next(err);
    }
  }
}
