import type { Request, Response, NextFunction } from "express";
import { ReferentService } from "./referent.service";

export class ReferentController {
  constructor(private service: ReferentService) {}

  async getDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const dashboard = await this.service.getDashboard(req.user!.id);
      res.status(200).json(dashboard);
    } catch (err) {
      next(err);
    }
  }
}
