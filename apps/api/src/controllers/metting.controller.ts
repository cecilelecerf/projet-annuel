import { MettingService } from "@api/services/metting.service";
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

    const handlers: Partial<Record<typeof role, () => Promise<any[] | null>>> =
      {
        VETERINARIAN: () =>
          mettingService.getCalendarForVeterinarian(id, start, end),
        SECRETARY: () => mettingService.getCalendarForSecretary(id, start, end),
        REFERANT: () => mettingService.getCalendarForReferant(id, start, end),
      };

    const handler = handlers[role];
    if (!handler) return res.status(200).json([]);

    const meetings = await handler();
    if (!meetings) return res.status(404).json();

    return res.status(200).json(meetings);
  }
}
