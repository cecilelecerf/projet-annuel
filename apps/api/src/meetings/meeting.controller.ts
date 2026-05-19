import { getPeriodQuerySchema, calendarSchema } from "@armali/schemas";
import type { NextFunction, Response } from "express";
import { BadRequestError, NotFoundError } from "@api/errors";
import { prisma } from "@api/lib/prisma";
import { AuthenticatedRequest, RequestWithParams } from "@api/middlewares";
import { MeetingService } from "./meeting.service";
import { UserService } from "@api/users";

const meetingService = new MeetingService();
const userService = new UserService();

export class MeetingController {
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

      const [vetProfile, clientProfile, clinicId] = await Promise.all([
        role === "VETERINARIAN"
          ? prisma.veterinarianProfile.findFirst({
              where: { user: { id: userId } },
            })
          : null,
        role === "CLIENT"
          ? prisma.clientProfile.findFirst({ where: { user: { id: userId } } })
          : null,
        ["SECRETARY", "DIRECTOR", "REFERANT"].includes(role)
          ? userService.getClinicId({ userId, role }).catch(() => null)
          : null,
      ]);

      const calendar = await meetingService.getCalendar({
        userId,
        role,
        vetProfileId: vetProfile?.id,
        clientProfileId: clientProfile?.id,
        clinicId: clinicId ?? undefined,
        start,
        end,
      });

      return res.status(200).json(calendarSchema.parse(calendar));
    } catch (err) {
      next(err);
    }
  }

  async getVeterinarianCalendar(
    req: RequestWithParams<{ veterinarianId: string }>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const result = getPeriodQuerySchema.safeParse(req.query);
      if (!result.success)
        throw new BadRequestError("startDate et endDate sont requis");

      const { startDate: start, endDate: end } = result.data;
      const { veterinarianId } = req.params;

      const [veterinarian, clinicId] = await Promise.all([
        prisma.veterinarianProfile.findUniqueOrThrow({
          where: { id: veterinarianId },
        }),
        userService.getClinicId({ userId: req.user.id, role: req.user.role }),
      ]);
      if (!veterinarian) throw new NotFoundError("Veterinarian");

      const [internal, animal, availabilities] = await Promise.all([
        meetingService.getInternalMeetings(veterinarian.id, start, end),
        meetingService.getAnimalMeetingsAsVet(veterinarian.id, start, end),
        meetingService.getAvailabilitiesByClinic({ clinicId, start, end }),
      ]);
      console.log(internal, animal);
      return res.status(200).json(
        calendarSchema.parse({
          meetings: [...internal, ...animal],
          availabilities,
        }),
      );
    } catch (err) {
      next(err);
    }
  }

  async getMeeting(
    req: RequestWithParams<{ id: string }>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const meeting = await prisma.meetingBase.findUnique({
        where: { id: req.params.id },
        include: {
          animalMeeting: true,
          internalMeeting: { include: { participants: true } },
          availabilty: true,
          parent: true,
        },
      });

      if (!meeting) throw new NotFoundError("Meeting");

      return res
        .status(200)
        .json(meetingService.flattenMeetingByBase(meeting as any));
    } catch (err) {
      next(err);
    }
  }
}
