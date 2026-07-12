import z from "zod";
import { petSchema } from "../pet.schema";
import { petIdSchema } from "../ids";

export const updateVeterinarianPetsSchema = z.object({
  petIds: petIdSchema.array(),
});

export type UpdateVeterinarianPets = z.infer<
  typeof updateVeterinarianPetsSchema
>;

export const veterinarianPetsSchema = petSchema.array();
