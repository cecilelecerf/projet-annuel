import type { Response, NextFunction } from "express";
import {
  ClinicId,
  userRoleSchema,
  createVeterinarianStaffSchema,
  createSecretaryStaffSchema,
  createReferentStaffSchema,
  UserId,
  staffMemberSchema,
  staffMemberDetailSchema,
  VeterinarianClinicId,
} from "@armali/schemas";
import { RequestWithParams } from "@api/middlewares";
import z from "zod";
import { VeterinarianClinicService } from "./veterinarian-clinic.service";

export class VeterinarianClinicController {
  constructor(private service: VeterinarianClinicService) {}

  async getById(
    req: RequestWithParams<{ id: VeterinarianClinicId }>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const staff = await this.service.getById({
        id: req.params.id,
      });
      res.status(200).json(staffMemberSchema.array().parse(staff));
    } catch (err) {
      next(err);
    }
  }
}
