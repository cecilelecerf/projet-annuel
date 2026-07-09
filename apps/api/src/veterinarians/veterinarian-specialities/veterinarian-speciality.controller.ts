import type { NextFunction, Response } from "express";
import type { AuthenticatedRequest, RequestWithParams } from "@api/middlewares";
import { BadRequestError } from "@api/errors";
import { specialitySchema, VeterinarianId } from "@armali/schemas";
import {
  UpdateVeterinarianSpecialities,
  updateVeterinarianSpecialitiesSchema,
} from "../../../../../packages/schemas/src/veterinarians/veterinarian-speciality.schema";
import { VeterinarianSpecialityService } from "./veterinarian-speciality.service";

export class VeterinarianSpecialityController {
  constructor(private service: VeterinarianSpecialityService) {}

  async getAcceptedSpecialities(
    req: RequestWithParams<{ id: VeterinarianId }>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const specialities = await this.service.getSpecialities(req.params.id);
      res.status(200).json(specialitySchema.array().parse(specialities));
    } catch (err) {
      next(err);
    }
  }

  async setAcceptedSpecialities(
    req: RequestWithParams<{ id: VeterinarianId }> &
      AuthenticatedRequest & { body: UpdateVeterinarianSpecialities },
    res: Response,
    next: NextFunction,
  ) {
    try {
      const result = updateVeterinarianSpecialitiesSchema.safeParse(req.body);
      if (!result.success) throw new BadRequestError(result.error.message);

      const specialities = await this.service.setSpecialities(
        req.params.id,
        result.data.specialityIds,
        req.user.role,
        req.user.id,
      );
      res.status(200).json(specialitySchema.array().parse(specialities));
    } catch (err) {
      next(err);
    }
  }
}
