import z from "zod";
import { specialityIdSchema } from "../ids";

export const updateVeterinarianSpecialitiesSchema = z.object({
  specialityIds: z.array(specialityIdSchema),
});

export type UpdateVeterinarianSpecialities = z.infer<
  typeof updateVeterinarianSpecialitiesSchema
>;
