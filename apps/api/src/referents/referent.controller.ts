import type { Request, Response, NextFunction } from "express";
import { ReferentService } from "./referent.service";
import { referentDashboardSchema } from "@armali/schemas";

export class ReferentController {
  constructor(private service: ReferentService) {}

  async getDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const dashboard = await this.service.getDashboard(req.user!.id);
      res.status(200).json(referentDashboardSchema.parse(dashboard));
    } catch (err) {
      next(err);
    }
  }
}
