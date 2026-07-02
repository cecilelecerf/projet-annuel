import {
  getPeriodQuerySchema,
  calendarSchema,
  availabilitiesSchema,
  animalMeetingMetaSchema,
  internalMeetingMetaSchema,
} from "@armali/schemas";
import type { NextFunction, Response } from "express";
import { BadRequestError, ConflictError, NotFoundError } from "@api/errors";
import { prisma } from "@api/lib/prisma";
import { AuthenticatedRequest, RequestWithParams } from "@api/middlewares";
import { MeetingService } from "./meeting.service";
import { UserService } from "@api/users";
import { AnimalMeetingService } from "./animal-meeting";
import { InternalMeetingService } from "./internal-meeting";
import { AvailabilityService } from "./availability";

export class MeetingController {
  constructor(
    private service: MeetingService,
    private userService: UserService,
    private animalMeetingService: AnimalMeetingService,
    private availabilityService: AvailabilityService,
    private internalMeetingService: InternalMeetingService,
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
          ? this.userService.getClinicId({ userId, role }).catch(() => null)
          : null,
      ]);

      const calendar = await this.service.getCalendar({
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
        prisma.veterinarianProfile.findUnique({
          where: { id: veterinarianId },
        }),
        this.userService.getClinicId({
          userId: req.user.id,
          role: req.user.role,
        }),
      ]);
      if (!veterinarian) throw new NotFoundError("Veterinarian");

      const [internal, animal, availabilities] = await Promise.all([
        this.service.getInternalMeetings(veterinarian.id, start, end),
        this.service.getAnimalMeetingsAsVet(veterinarian.id, start, end),
        this.service.getAvailabilitiesByClinic({ clinicId, start, end }),
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
  async getMyMeetings(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const meetings = await meetingListService.getForUser(
        req.user.id,
        req.user.role,
      );
      return res.status(200).json(meetingListSchema.parse(meetings));
    } catch (err) {
      next(err);
    }
  }
  async getMeeting(
    req: RequestWithParams<{ id: string }> & { query: { date?: string } },
    res: Response,
    next: NextFunction,
  ) {
    try {
      const isRecurring = !!req.query.date;

      const kind = isRecurring
        ? (
            await prisma.meetingReccuring.findUnique({
              where: { id: req.params.id },
              select: { kind: true },
            })
          )?.kind
        : (
            await prisma.meetingBase.findUnique({
              where: { id: req.params.id },
              select: { kind: true },
            })
          )?.kind;

      if (!kind) throw new NotFoundError("Meeting");

      const recurringBase = isRecurring
        ? await prisma.meetingReccuring
            .findUnique({
              where: { id: req.params.id },
            })
            .then((base) => {
              if (!base) throw new NotFoundError("Meeting");
              const date = new Date(req.query.date!);
              if (isNaN(date.getTime()))
                throw new BadRequestError("date invalide");
              return {
                id: base.id,
                createdAt: base.createdAt,
                updatedAt: base.updatedAt,
                startTime: base.startTime,
                endTime: base.endTime,
                kind: base.kind,
                date: date.toISOString(),
                type: "SPECIFIED" as const,
                parentId: base.id,
              };
            })
        : null;

      switch (kind) {
        case "ANIMAL": {
          const meeting = await this.animalMeetingService.getById({
            id: req.params.id,
            userId: req.user.id,
            role: req.user.role,
          });
          if (recurringBase)
            throw new ConflictError("Animal meeting nor recurrent");
          const data = { ...meeting, ...meeting.meeting };
          return res.status(200).json(animalMeetingMetaSchema.parse(data));
        }
        case "INTERNAL": {
          const meeting = await this.internalMeetingService.getById({
            id: req.params.id,
            role: req.user.role,
          });
          const data = recurringBase
            ? { ...meeting, ...recurringBase }
            : { ...meeting, ...meeting.meeting };
          return res.status(200).json(internalMeetingMetaSchema.parse(data));
        }
        case "AVAILABILITY": {
          const meeting = await this.availabilityService.getById({
            id: req.params.id,
            userId: req.user.id,
            role: req.user.role,
          });
          const data = recurringBase
            ? { ...meeting, ...recurringBase }
            : { ...meeting, ...meeting.meeting };

          return res.status(200).json(availabilitiesSchema.parse(data));
        }
        default:
          throw new NotFoundError("Meeting");
      }
    } catch (err) {
      next(err);
    }
  }
}
