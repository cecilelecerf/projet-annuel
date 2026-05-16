import { calendarSchema } from "@armali/schemas";
import type { NextFunction, Response } from "express";
import { z } from "zod";
import { NotFoundError, BadRequestError } from "@api/errors";
import { prisma } from "@api/lib/prisma";
import { VeterinarianProfile } from "apps/api/prisma/generated/prisma/client";
import { UserService } from "@api/users";
import { AuthenticatedRequest } from "@api/middlewares";
import { FlatMeeting, MeetingService } from "./meeting.service";

const meetingService = new MeetingService();
const userService = new UserService();
const querySchema = z.object({
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
});

export class MeetingController {
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
        Record<typeof role, () => Promise<FlatMeeting[] | null>>
      > = {
        VETERINARIAN: () =>
          meetingService.getMeetingsForVeterinarian(id, start, end),
        SECRETARY: () => meetingService.getMeetingsForSecretary(id, start, end),
        REFERANT: () => meetingService.getMeetingsForReferant(id, start, end),
      };
      const availabilities = await meetingService.getAllAvailibilities({
        id,
        start,
        end,
      });

      const handler = handlers[role];
      if (!handler) return res.status(200).json([]);

      const meetings = await handler();
      if (!meetings) throw new NotFoundError("Profile");
      return res
        .status(200)
        .json(calendarSchema.parse({ meetings, availabilities }));
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

      const requester = prisma.user.findUnique({
        where: { id: req.user.id },
        include: {
          directorClinicProfile: true,
          referentClinicProfile: true,
          secretaryProfile: true,
        },
      });
      const clinicId = await userService.getClinicId({
        userId: req.user.id,
        role: req.user.role,
      });
      const { startDate: start, endDate: end } = result.data;
      const { veterinarianId } = req.params as {
        veterinarianId: VeterinarianProfile["id"];
      };

      const veterinarian = await prisma.veterinarianProfile.findUnique({
        where: { id: veterinarianId },
      });
      if (!veterinarian) throw new NotFoundError("Veterinarian");
      const handler = meetingService.getMeetingsForVeterinarian(
        veterinarian.id,
        start,
        end,
      );
      if (!handler) return res.status(200).json([]);

      const availabilities = await meetingService.getAvailibilitiesByClinic({
        id: veterinarianId,
        clinicId,
        start,
        end,
      });

      const meetings = await handler;
      if (!meetings) throw new NotFoundError("Profile");

      return res
        .status(200)
        .json(calendarSchema.parse({ meetings, availabilities }));
    } catch (err) {
      next(err);
    }
  }
}
