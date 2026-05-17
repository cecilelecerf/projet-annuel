import type { NextFunction, Response } from "express";
import { AuthenticatedRequest, RequestWithParams } from "@api/middlewares";
import { CreateAvailability } from "@armali/schemas";
import { AvailabilityService } from "./availability.service";
import { prisma } from "@api/lib/prisma";
import { ForbiddenError, NotFoundError } from "@api/errors";
import { VeterinarianClinic } from "../../../prisma/generated/prisma/client";

const availabilityService = new AvailabilityService();

export class AvailabilityController {
  async create(
    req: AuthenticatedRequest & { body: CreateAvailability },
    res: Response,
    next: NextFunction,
  ) {
    try {
      if (!req.user.clinicId) throw new ForbiddenError();
      const availability = await availabilityService.create({
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
      if (!req.user.clinicId) throw new ForbiddenError();
      // TODO : vérificaiton author travail bien dans la clinic
      await availabilityService.delete({
        id: req.params.id,
        authorId: req.user.id,
      });
      res.status(204).json();
    } catch (err) {
      next(err);
    }
  }
}
