import type { Request, Response, NextFunction } from "express";
import { ClinicRequestService } from "./request.service";
import { clinicGuardRequest } from "@armali/schemas";
import { AuthenticatedRequest } from "@api/middlewares";

export class ClinicRequestController {
  constructor(private service: ClinicRequestService) {}

  async getClinicStatus(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const status = await this.service.getClinicStatus(req.user!.id);

      res.status(200).json(clinicGuardRequest.parse(status));
    } catch (err) {
      next(err);
    }
  }

  async requestClinic(req: Request, res: Response, next: NextFunction) {
    try {
      const request = await this.service.requestClinic(req.user!.id, req.body);
      res.status(201).json(request);
    } catch (err) {
      next(err);
    }
  }

  async getMyRequests(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const requests = await this.service.getMyRequests(req.user!.id);
      res.status(200).json(requests);
    } catch (err) {
      next(err);
    }
  }
}
