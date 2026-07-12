import type { Request, Response, NextFunction } from "express";
import { SalesService } from "./sales.service";

export class SalesController {
  constructor(private service: SalesService) {}

  async getReport(req: Request, res: Response, next: NextFunction) {
    try {
      const from = req.query.from as string | undefined;
      const to = req.query.to as string | undefined;
      const report = await this.service.getReport(
        req.user!.id,
        req.user!.role,
        from,
        to,
      );
      res.status(200).json(report);
    } catch (err) {
      next(err);
    }
  }
}
