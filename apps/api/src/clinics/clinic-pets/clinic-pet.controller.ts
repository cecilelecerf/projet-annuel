import type { NextFunction, Response } from "express";
import type { AuthenticatedRequest, RequestWithParams } from "@api/middlewares";
import { BadRequestError } from "@api/errors";
import {
  petSchema,
  ClinicId,
  UpdateClinicPets,
  updateClinicPetsSchema,
} from "@armali/schemas";
import { ClinicPetService } from "./clinic-pet.service";

export class ClinicPetController {
  constructor(private service: ClinicPetService) {}

  async getAcceptedPets(
    req: RequestWithParams<{ id: ClinicId }>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const pets = await this.service.getAcceptedPets(req.params.id);
      res.status(200).json(petSchema.array().parse(pets));
    } catch (err) {
      next(err);
    }
  }

  async setAcceptedPets(
    req: RequestWithParams<{ id: ClinicId }> &
      AuthenticatedRequest & { body: UpdateClinicPets },
    res: Response,
    next: NextFunction,
  ) {
    try {
      const result = updateClinicPetsSchema.safeParse(req.body);
      if (!result.success) throw new BadRequestError(result.error.message);

      const pets = await this.service.setAcceptedPets(
        req.params.id,
        result.data.petIds,
        req.user.role,
        req.user.id,
      );
      res.status(200).json(petSchema.array().parse(pets));
    } catch (err) {
      next(err);
    }
  }
}
