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
export const clinicRequestBaseSchema = clinicSchema
  .omit({ id: true, lat: true, lng: true, openingHours: true, image: true })
  .extend({
    id: clinicRequestIdSchema,
    status: clinicStatusSchema,
  });

export const clinicGuardRequest = z.object({
  status: clinicStatusSchema,
  clinic: clinicSchema.optional(),
  request: clinicRequestBaseSchema.optional(),
});

export const clinicRequestSchema = clinicRequestBaseSchema.extend({
  director: directorProfileSchema.extend({ user: baseUserSchema }),
});

export type ClinicRequest = z.infer<typeof clinicRequestSchema>;
export type ClinicRequestBase = z.infer<typeof clinicRequestBaseSchema>;
export type ClinicStatus = z.infer<typeof clinicStatusSchema>;
