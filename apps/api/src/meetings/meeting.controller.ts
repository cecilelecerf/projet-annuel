import {
  getPeriodQuerySchema,
  calendarSchema,
  meetingSchema,
  animalMeetingSchema,
  internalMeetingSchema,
  availabilitiesSchema,
  animalMeetingMetaSchema,
  internalMeetingMetaSchema,
} from "@armali/schemas";
import type { NextFunction, Response } from "express";
import { BadRequestError, NotFoundError } from "@api/errors";
import { prisma } from "@api/lib/prisma";
import { AuthenticatedRequest, RequestWithParams } from "@api/middlewares";
import { MeetingService } from "./meeting.service";
import { UserService } from "@api/users";
import { AnimalMeetingService } from "./animal-meeting";
import { InternalMeetingService } from "./internal-meeting";
import { AvailabilityService } from "./availability";

const meetingService = new MeetingService();
const animalMeetingService = new AnimalMeetingService();
const internalMeetingService = new InternalMeetingService();
const availabilityService = new AvailabilityService();
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
      const base = await prisma.meetingBase.findUnique({
        where: { id: req.params.id },
        select: { kind: true },
      });

      if (!base) throw new NotFoundError("Meeting");

      switch (base.kind) {
        case "ANIMAL": {
          const meeting = await animalMeetingService.getById({
            id: req.params.id,
            userId: req.user.id,
            role: req.user.role,
          });
          console.log(meeting);
          return res
            .status(200)
            .json(
              animalMeetingMetaSchema.parse({ ...meeting, ...meeting.meeting }),
            );
        }
        case "INTERNAL": {
          const meeting = await internalMeetingService.getById({
            id: req.params.id,
            role: req.user.role,
          });
          return res.status(200).json(
            internalMeetingMetaSchema.parse({
              ...meeting,
              ...meeting.meeting,
            }),
          );
        }
        case "AVAILABILITY": {
          const meeting = await availabilityService.getById({
            id: req.params.id,
            userId: req.user.id,
            role: req.user.role,
          });
          return res
            .status(200)
            .json(availabilitiesSchema.parse({ ...meeting, ...meeting }));
        }
        default:
          throw new NotFoundError("Meeting");
      }
    } catch (err) {
      next(err);
    }
  }
}
