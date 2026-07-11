import z from "zod";
import { clinicSchema } from "./clinic.schema";
import { baseUserSchema, directorProfileSchema } from "../users";
import { clinicRequestIdSchema } from "../ids";

export const clinicStatusSchema = z.enum([
  "NONE",
  "PENDING",
  "REJECTED",
  "APPROVED",
]);
export const clinicGuardRequest = z.object({
  status: clinicStatusSchema,
  clinic: clinicSchema.optional(),
  request: clinicSchema.optional(),
});

export const clinicRequestSchema = clinicSchema.omit({ id: true }).extend({
  id: clinicRequestIdSchema,
  status: clinicStatusSchema,
  director: directorProfileSchema.extend({ user: baseUserSchema }),
});

export type ClinicRequest = z.infer<typeof clinicRequestSchema>;
export type ClinicStatus = z.infer<typeof clinicStatusSchema>;
