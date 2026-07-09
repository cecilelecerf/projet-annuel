import z from "zod";
import { clinicSchema } from "./clinic.schema";

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
export type ClinicStatus = z.infer<typeof clinicStatusSchema>;
