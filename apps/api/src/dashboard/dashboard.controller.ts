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
        .with("CLIENT", () => this.service.getClientDashboard(userId))
        .otherwise(() => {
          throw new ForbiddenError();
        });

      res.status(200).json(dashboardSchema.parse(dashboard));
    } catch (err) {
      next(err);
    }
  }
}
