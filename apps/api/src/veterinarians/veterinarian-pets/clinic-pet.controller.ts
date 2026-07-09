import type { NextFunction, Response } from "express";
import type { AuthenticatedRequest, RequestWithParams } from "@api/middlewares";
import { BadRequestError } from "@api/errors";
import { petSchema, VeterinarianId } from "@armali/schemas";
import { VeterinarianPetService } from "./clinic-pet.service";
import {
  UpdateVeterinarianPets,
  updateVeterinarianPetsSchema,
} from "../../../../../packages/schemas/src/veterinarians/veterinarian-pet.schema";

export class VeterinarianPetController {
  constructor(private service: VeterinarianPetService) {}

  async getAcceptedPets(
    req: RequestWithParams<{ id: VeterinarianId }>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const pets = await this.service.getPets(req.params.id);
      res.status(200).json(petSchema.array().parse(pets));
    } catch (err) {
      next(err);
    }
  }

  async setAcceptedPets(
    req: RequestWithParams<{ id: VeterinarianId }> &
      AuthenticatedRequest & { body: UpdateVeterinarianPets },
    res: Response,
    next: NextFunction,
  ) {
    try {
      const result = updateVeterinarianPetsSchema.safeParse(req.body);
      if (!result.success) throw new BadRequestError(result.error.message);

      const pets = await this.service.setPets(
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
