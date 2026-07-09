import type { NextFunction, Response } from "express";
import type { AuthenticatedRequest, RequestWithParams } from "@api/middlewares";
import { BadRequestError } from "@api/errors";
import {
  petSchema,
  ClinicId,
  UpdateClinicSpecialities,
  updateClinicSpecialitiesSchema,
  specialitySchema,
} from "@armali/schemas";
import { ClinicSpecialityService } from "./clinic-speciality.service";

export class ClinicSpecialityController {
  constructor(private service: ClinicSpecialityService) {}

  async getAcceptedSpecialities(
    req: RequestWithParams<{ id: ClinicId }>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const specialities = await this.service.getAcceptedSpecialities(
        req.params.id,
      );
      res.status(200).json(specialitySchema.array().parse(specialities));
    } catch (err) {
      next(err);
    }
  }

  async setAcceptedSpecialities(
    req: RequestWithParams<{ id: ClinicId }> &
      AuthenticatedRequest & { body: UpdateClinicSpecialities },
    res: Response,
    next: NextFunction,
  ) {
    try {
      const result = updateClinicSpecialitiesSchema.safeParse(req.body);
      if (!result.success) throw new BadRequestError(result.error.message);

      const specialities = await this.service.setAcceptedSpecialities(
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
