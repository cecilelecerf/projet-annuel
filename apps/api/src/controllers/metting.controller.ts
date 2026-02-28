import { prisma } from "@api/lib/prisma";
import { MettingService } from "@api/services/metting.service";
import {
  meetingSchema,
  mettingBaseSchema,
  mettingWithExceptionSchema,
} from "@schemas";
import type { Request, Response } from "express";
import { z } from "zod";

const mettingService = new MettingService();

const querySchema = z.object({
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
});

export class MettingController {
  async getMyCalendar(req: Request, res: Response) {
    if (!req.user) return res.status(401).json();

    const result = querySchema.safeParse(req.query);
    if (!result.success) {
      return res
        .status(400)
        .json({ message: "startDate et endDate sont requis" });
    }

    const { startDate: start, endDate: end } = result.data;
    const { role, id } = req.user;

    if (role === "VETERINARIAN") {
      const profile = await prisma.veterinarianProfile.findUnique({
        where: { id },
        include: {
          animalMeeting: {
            where: {
              base: {
                OR: [
                  { type: "SPECIFIED", specificDate: { gte: start, lte: end } },
                  {
                    type: "RECURRING",
                    dateStart: { lte: end },
                    dateEnd: { gte: start },
                  },
                ],
              },
            },
            include: {
              base: {
                include: { exceptions: true },
              },
            },
          },
          user: {
            include: {
              internalMettingParticipants: {
                where: {
                  metting: {
                    base: {
                      OR: [
                        {
                          type: "SPECIFIED",
                          specificDate: { gte: start, lte: end },
                        },
                        {
                          type: "RECURRING",
                          dateStart: { lte: end },
                          dateEnd: { gte: start },
                        },
                      ],
                    },
                  },
                },
                include: {
                  metting: {
                    include: {
                      base: {
                        include: { exceptions: true },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!profile) return res.status(404).json();

      const animalMeetings = profile.animalMeeting.map(
        ({ base, ...meeting }) => ({
          ...base,
          ...meeting,
        }),
      );

      const internalMeetings = profile.user.internalMettingParticipants
        .filter((p) => p.metting)
        .map(({ metting: { base, ...meeting } }) => ({
          ...base,
          ...meeting,
        }));

      const parsed = z
        .array(mettingWithExceptionSchema)
        .parse([...animalMeetings, ...internalMeetings]);
      console.log(parsed);
      const recurring = parsed.filter((m) => m.type === "RECURRING");
      const nonRecurring = parsed
        .filter((m) => m.type !== "RECURRING")
        .map(({ exceptions, ...recurring }) => recurring);

      const expandedRecurring = recurring
        .flatMap((metting) =>
          mettingService.expandRecurring({ metting, start, end }),
        )
        .map(({ exceptions, ...recurring }) => recurring);

      return res.status(200).json([...nonRecurring, ...expandedRecurring]);
    }

    return res.status(200).json([]);
  }
}
