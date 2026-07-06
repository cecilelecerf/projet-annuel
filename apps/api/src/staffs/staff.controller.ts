import type { Response, NextFunction } from "express";
import { StaffService } from "./staff.service";
import {
  ClinicId,
  clinicSchema,
  staffSchema,
  userRoleSchema,
  createVeterinarianStaffSchema,
  createSecretaryStaffSchema,
  createReferentStaffSchema,
  UserId,
} from "@armali/schemas";
import { AuthenticatedRequest, RequestWithParams } from "@api/middlewares";
import { BadRequestError } from "@api/errors";
import z from "zod";

export class StaffController {
  constructor(private service: StaffService) {}

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

  async getStaffMemberDetail(
    req: RequestWithParams<{ id: UserId }>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const member = await this.service.getStaffMemberDetail({
        authorId: req.user.id,
        memberId: req.params.id,
      });
      res.status(200).json(member);
    } catch (err) {
      next(err);
    }
  }

  async createVeterinarian(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const result = createVeterinarianStaffSchema.safeParse(req.body);
      if (!result.success) throw new BadRequestError(result.error.message);

      const user = await this.service.createVeterinarian({
        authorId: req.user.id,
        data: result.data,
      });
      res.status(201).json(user);
    } catch (err) {
      next(err);
    }
  }

  async createSecretary(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const result = createSecretaryStaffSchema.safeParse(req.body);
      if (!result.success) throw new BadRequestError(result.error.message);

      const user = await this.service.createSecretary({
        authorId: req.user.id,
        data: result.data,
      });
      res.status(201).json(user);
    } catch (err) {
      next(err);
    }
  }

  async createReferent(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const result = createReferentStaffSchema.safeParse(req.body);
      if (!result.success) throw new BadRequestError(result.error.message);

      const user = await this.service.createReferent({
        authorId: req.user.id,
        data: result.data,
      });
      res.status(201).json(user);
    } catch (err) {
      next(err);
    }
  }
}
