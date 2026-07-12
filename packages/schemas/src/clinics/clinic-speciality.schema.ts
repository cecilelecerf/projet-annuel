import z from "zod";
import { specialityIdSchema } from "../ids";

export const updateClinicSpecialitiesSchema = z.object({
  specialityIds: z.array(specialityIdSchema),
});

export type UpdateClinicSpecialities = z.infer<
  typeof updateClinicSpecialitiesSchema
>;
