import type { Request, Response, NextFunction } from "express";
import { match } from "ts-pattern";
import { DashboardService } from "./dashboard.service";
import { dashboardSchema } from "@armali/schemas";
import { ForbiddenError } from "@api/errors";

export class DashboardController {
  constructor(private service: DashboardService) {}

  async getDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const { id: userId, role } = req.user!;

      const dashboard = await match(role)
        .with("REFERENT", (r) => this.service.getClinicDashboard(userId, r))
        .with("DIRECTOR", (r) => this.service.getClinicDashboard(userId, r))
        .with("SECRETARY", () => this.service.getSecretaryDashboard(userId))
        .with("VETERINARIAN", () =>
          this.service.getVeterinarianDashboard(userId),
        )
        .with("ADMIN", () => this.service.getAdminDashboard())
        .otherwise(() => {
          throw new ForbiddenError();
        });

      res.status(200).json(dashboardSchema.parse(dashboard));
    } catch (err) {
      next(err);
    }
  }

  async getVisitsForecast(req: Request, res: Response, next: NextFunction) {
    try {
      const { id: userId, role } = req.user!;
      const forecast = await match(role)
        .with("REFERENT", (r) => this.service.getVisitsForecast(userId, r))
        .with("DIRECTOR", (r) => this.service.getVisitsForecast(userId, r))
        .otherwise(() => {
          throw new ForbiddenError();
        });

      res.status(200).json(forecast);
    } catch (err) {
      next(err);
    }
  }

  async getAnalyticsOverview(req: Request, res: Response, next: NextFunction) {
    try {
      const { id: userId, role } = req.user!;
      const overview = await match(role)
        .with("REFERENT", (r) => this.service.getAnalyticsOverview(userId, r))
        .with("DIRECTOR", (r) => this.service.getAnalyticsOverview(userId, r))
        .otherwise(() => {
          throw new ForbiddenError();
        });

      res.status(200).json(overview);
    } catch (err) {
      next(err);
    }
  }
}
