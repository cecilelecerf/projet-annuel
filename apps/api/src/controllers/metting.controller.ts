import { FlatMetting, MettingService } from "@api/services/metting.service";
import { mettingWithExceptionSchema, VeterinarianId } from "@schemas";
import type { NextFunction, Response } from "express";
import { z } from "zod";
import { NotFoundError, BadRequestError } from "@api/errors";
import { AuthenticatedRequest } from "@api/middlewares/auth.middleware";
import { prisma } from "@api/lib/prisma";

const mettingService = new MettingService();

const querySchema = z.object({
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
});

export class MettingController {
  async getMyCalendar(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const result = querySchema.safeParse(req.query);
      if (!result.success)
        throw new BadRequestError("startDate et endDate sont requis");

      const { startDate: start, endDate: end } = result.data;
      const { role, id } = req.user;

      const handlers: Partial<
        Record<typeof role, () => Promise<FlatMetting[] | null>>
      > = {
        VETERINARIAN: () =>
          mettingService.getCalendarForVeterinarian(id, start, end),
        SECRETARY: () => mettingService.getCalendarForSecretary(id, start, end),
        REFERANT: () => mettingService.getCalendarForReferant(id, start, end),
      };

      const handler = handlers[role];
      if (!handler) return res.status(200).json([]);

      const meetings = await handler();
      if (!meetings) throw new NotFoundError("Profile");

      return res
        .status(200)
        .json(z.array(mettingWithExceptionSchema).parse(meetings));
    } catch (err) {
      next(err);
    }
  }

  async getVeterinarianCalendar(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const result = querySchema.safeParse(req.query);
      if (!result.success)
        throw new BadRequestError("startDate et endDate sont requis");

      const { startDate: start, endDate: end } = result.data;
      const { veterinarianId } = req.params;

      const veterinarian = await prisma.veterinarianProfile.findUnique({
        where: { id: veterinarianId as VeterinarianId },
      });
      if (!veterinarian) throw new NotFoundError("Veterinarian");
      const handler = mettingService.getCalendarForVeterinarian(
        veterinarian.id,
        start,
        end,
      );
      if (!handler) return res.status(200).json([]);

      const meetings = await handler;
      if (!meetings) throw new NotFoundError("Profile");

      return res
        .status(200)
        .json(z.array(mettingWithExceptionSchema).parse(meetings));
    } catch (err) {
      next(err);
    }
  }
}
