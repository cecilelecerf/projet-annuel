import { z } from "zod";
import { actIdSchema, clinicActIdSchema, clinicIdSchema } from "../ids";
import { actSchema } from "./act.schema";

export const clinicActSchema = z.object({
  id: clinicActIdSchema,
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  price: z.coerce.number().multipleOf(0.01),
  actId: actIdSchema,
  clinicId: clinicIdSchema,
  act: actSchema.optional(),
});

export const createClinicActSchema = clinicActSchema.pick({
  price: true,
  actId: true,
});
export const updateClinicActSchema = createClinicActSchema.partial();

export type ClinicAct = z.infer<typeof clinicActSchema>;
export type CreateClinicAct = z.infer<typeof createClinicActSchema>;
export type UpdateClinicAct = z.infer<typeof updateClinicActSchema>;
