import type { Response, NextFunction } from "express";
import { ClinicService } from "./clinic.service";
import {
  ClinicId,
  clinicSchema,
  staffSchema,
  userRoleSchema,
} from "@armali/schemas";
import { AuthenticatedRequest, RequestWithParams } from "@api/middlewares";
import z from "zod";

export class ClinicController {
  constructor(private service: ClinicService) {}
  async getClientsByClinic(
    req: RequestWithParams<{ id: ClinicId }>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const staff = await this.service.getClientsByClinic({
        authorId: req.user.id,
        clinicId: req.params.id,
        role: req.user.role,
      });
      res.status(200).json(staffSchema.array().parse(staff));
    } catch (err) {
      next(err);
    }
  }

  async getStaffByClinic(
    req: RequestWithParams<{ id: ClinicId }>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const query = z
        .object({
          roles: z.preprocess(
            (val) =>
              val === undefined ? undefined : Array.isArray(val) ? val : [val],
            userRoleSchema.array().optional(),
          ),
        })
        .parse(req.query);

      const staff = await this.service.getStaffByClinicRole({
        authorId: req.user.id,
        clinicId: req.params.id,
        role: req.user.role,
        targetRoles: query.roles,
      });
      res.status(200).json(staffSchema.array().parse(staff));
    } catch (err) {
      next(err);
    }
  }

  async getMineStaff(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const staff = await this.service.getStaffByUser(
        req.user!.id,
        req.user!.role,
      );
      res.status(200).json(staff);
    } catch (err) {
      next(err);
    }
  }

  async getMyClinic(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const clinics = await this.service.getClinicByUser(req.user.id);
      res.status(200).json(clinicSchema.array().parse(clinics));
    } catch (err) {
      next(err);
    }
  }

  async updateClinic(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const clinic = await this.service.updateClinic(req.user!.id, req.body);
      res.status(200).json(clinic);
    } catch (err) {
      next(err);
    }
  }
}
