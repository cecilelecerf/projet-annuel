import type { Request, Response, NextFunction } from "express";
import { ClinicRequestService } from "./request.service";
import {
  clinicGuardRequest,
  ClinicRequestId,
  clinicSchema,
  clinicStatusSchema,
} from "@armali/schemas";
import { AuthenticatedRequest, RequestWithParams } from "@api/middlewares";
import { ForbiddenError } from "@api/errors";

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
      const request = await this.service.createRequestClinic(
        req.user!.id,
        req.body,
      );
      res.status(201).json(clinicGuardRequest.parse(request));
    } catch (err) {
      next(err);
    }
  }

  async getRequests(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      if (req.user.role === "ADMIN") {
        const requests = await this.service.getClinicRequests();
        res
          .status(200)
          .json(
            clinicSchema
              .extend({ status: clinicStatusSchema })
              .array()
              .parse(requests),
          );
        return;
      } else if (req.user.role === "DIRECTOR") {
        const requests = await this.service.getMyRequests(req.user!.id);
        res
          .status(200)
          .json(
            clinicSchema
              .extend({ status: clinicStatusSchema })
              .array()
              .parse(requests),
          );
        return;
      }
      throw new ForbiddenError();
    } catch (err) {
      next(err);
    }
  }

  async approveClinicRequest(
    req: RequestWithParams<{ id: ClinicRequestId }>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const result = await this.service.approveClinicRequest(req.params.id);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async rejectClinicRequest(
    req: RequestWithParams<{ id: ClinicRequestId }>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const result = await this.service.rejectClinicRequest(req.params.id);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
}
