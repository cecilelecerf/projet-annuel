import { prisma } from "@api/lib/prisma";
import type { Request, Response } from "express";

export class MettingController {
  async getMyCalendar(req: Request, res: Response) {
    if (!req.user) return res.status(404).json();
    const { role, id } = req.user;
    if (role === "VETERINARIAN") {
      const user = await prisma.veterinarianProfile.findUnique({
        where: { id },
        include: {
          user: {
            include: {
              internalMettingParticipants: {
                include: {
                  metting: {
                    include: { base: true },
                  },
                },
              },
            },
          },
          animalMeeting: { include: { base: true } },
        },
      });
      if (!user) return res.status(404).json();
      const animalMeeting = user.animalMeeting;
      const internalMeeting = user.user.internalMettingParticipants;
      res.status(201).json([...animalMeeting, ...internalMeeting]);
    }

    res.status(201).json();
  }
}
