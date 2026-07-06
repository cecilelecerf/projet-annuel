import {
  getPeriodQuerySchema,
  calendarSchema,
  availabilitiesSchema,
  animalMeetingMetaSchema,
  internalMeetingMetaSchema,
  bookingSlotSchema,
  clinicIdSchema,
  availabilityTimelineSchema,
} from "@armali/schemas";
import type { NextFunction, Response } from "express";
import { BadRequestError, ConflictError, NotFoundError } from "@api/errors";
import { prisma } from "@api/lib/prisma";
import { AuthenticatedRequest, RequestWithParams } from "@api/middlewares";
import { MeetingService } from "./meeting.service";
import { UserService } from "@api/users";
import { AnimalMeetingService } from "./animal-meeting";
import { InternalMeetingService } from "./internal-meeting";
import { AvailabilityService } from "./availabilities";
import z from "zod";
import { ClinicService } from "@api/clinics/clinic.service";

export class MeetingController {
  constructor(
    private service: MeetingService,
    private userService: UserService,
    private clinicService: ClinicService,
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

      const [vetProfile, clientProfile, clinicIds] = await Promise.all([
        role === "VETERINARIAN"
          ? prisma.veterinarianProfile.findFirst({
              where: { user: { id: userId } },
            })
          : null,
        role === "CLIENT"
          ? prisma.clientProfile.findFirst({ where: { user: { id: userId } } })
          : null,
        ["SECRETARY", "DIRECTOR", "REFERENT"].includes(role)
          ? this.clinicService
              .getClinicIdsByUserId({ userId, role })
              .catch(() => null)
          : null,
      ]);

      const calendar = await this.service.getCalendar({
        userId,
        role,
        vetProfileId: vetProfile?.id,
        clientProfileId: clientProfile?.id,
        clinicIds: clinicIds ?? undefined,
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

      const [veterinarian, clinicIds] = await Promise.all([
        prisma.veterinarianProfile.findUnique({
          where: { id: veterinarianId },
        }),
        this.clinicService.getClinicIdsByUserId({
          userId: req.user.id,
          role: req.user.role,
        }),
      ]);
      if (!veterinarian) throw new NotFoundError("Veterinarian");

      const [internal, animal, availabilities] = await Promise.all([
        this.service.getInternalMeetings(veterinarian.id, start, end),
        this.service.getAnimalMeetingsAsVet(veterinarian.id, start, end),
        this.service.getAvailabilities({
          userId: veterinarian.id,
          clinicIds,
          start,
          end,
        }),
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
  async getVetSlots(
    req: RequestWithParams<{ veterinarianId: string }>,
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
      const { veterinarianId } = req.params;

      const veterinarian = await prisma.veterinarianProfile.findUnique({
        where: { id: veterinarianId },
        include: { user: true },
      });
      if (!veterinarian) throw new NotFoundError("Veterinarian");

      const slots = await this.service.getVetSlots({
        veterinarianId: veterinarian.id,
        start: date,
        end: date,
        clinicIds: [clinicId],
      });
      return res.status(200).json(bookingSlotSchema.array().parse(slots));
    } catch (err) {
      console.log(err);
      next(err);
    }
  }

  async getAvailabilityTimeline(
    req: RequestWithParams<{ veterinarianId: string }>,
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
      const { veterinarianId } = req.params;

      const veterinarian = await prisma.veterinarianProfile.findFirst({
        where: { id: veterinarianId },
        include: { user: true },
      });
      if (!veterinarian) throw new NotFoundError("Veterinarian");
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const timeline = await this.service.getAvailabilityTimeline({
        veterinarianId: veterinarianId,
        clinicIds: [clinicId],
        start: startOfDay,
        end: endOfDay,
      });

      return res.status(200).json(availabilityTimelineSchema.parse(timeline));
    } catch (err) {
      next(err);
    }
  }
}
