import z from "zod";
import { petSchema } from "../pet.schema";
import { petIdSchema } from "../ids";

export const updateClinicPetsSchema = z.object({
  petIds: petIdSchema.array(),
});

export type UpdateClinicPets = z.infer<typeof updateClinicPetsSchema>;

export const clinicPetsSchema = petSchema.array();
