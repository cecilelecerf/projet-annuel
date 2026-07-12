import type { Response, NextFunction } from "express";
import { StaffService } from "./staff.service";
import {
  ClinicId,
  userRoleSchema,
  createVeterinarianStaffSchema,
  createSecretaryStaffSchema,
  createReferentStaffSchema,
  UserId,
  staffMemberSchema,
  staffMemberDetailSchema,
} from "@armali/schemas";
import { AuthenticatedRequest, RequestWithParams } from "@api/middlewares";
import { BadRequestError } from "@api/errors";
import z from "zod";

export class StaffController {
  constructor(private service: StaffService) {}

  async getStaffByClinic(
    req: RequestWithParams<{ clinicId: ClinicId }>,
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
        clinicId: req.params.clinicId,
        role: req.user.role,
        targetRoles: query.roles,
      });
      res.status(200).json(staffMemberSchema.array().parse(staff));
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
      res.status(200).json(staffMemberDetailSchema.parse(member));
    } catch (err) {
      next(err);
    }
  }

  async searchVeterinarian(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const query = typeof req.query.q === "string" ? req.query.q : "";
      const results = await this.service.searchVeterinarian({
        authorId: req.user.id,
        query,
      });
      res.status(200).json(results);
    } catch (err) {
      next(err);
    }
  }

  async linkVeterinarian(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const linked = await this.service.linkVeterinarian({
        authorId: req.user.id,
        authorRole: req.user.role,
        veterinarianId: req.body.veterinarianId,
      });
      res.status(201).json(linked);
    } catch (err) {
      next(err);
    }
  }

  async deleteStaffMember(
    req: RequestWithParams<{ id: UserId }>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const result = await this.service.deleteStaffMember({
        authorId: req.user.id,
        authorRole: req.user.role,
        memberId: req.params.id,
      });
      res.status(200).json(result);
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
      res.status(201).json(staffMemberDetailSchema.parse(user));
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
      res.status(201).json(staffMemberDetailSchema.parse(user));
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
      res.status(201).json(staffMemberDetailSchema.parse(user));
    } catch (err) {
      next(err);
    }
  }
}
