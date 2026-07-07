// ── VeterinarianClinic (junction) ─────────────────────────────────────────────

import z from "zod";
import {
  clinicIdSchema,
  veterinarianClinicIdSchema,
  veterinarianIdSchema,
} from "./ids";
import { veterinarianProfileSchema } from "./users/veterinarian.schema";
import { clinicSchema } from "./clinic.schema";
import { baseUserSchema } from "./users/base-user.schema";

export const veterinarianClinicSchema = z.object({
  id: veterinarianClinicIdSchema,
  veterinarianId: veterinarianIdSchema,
  clinicId: clinicIdSchema,
});

export const veterinarianClinicMetaSchema = z.object({
  id: veterinarianClinicIdSchema,
  veterinarianId: veterinarianIdSchema,
  veterinarian: veterinarianProfileSchema.extend({ user: baseUserSchema }),
  clinic: clinicSchema,
  clinicId: clinicIdSchema,
});
export const createVeterinarianClinicSchema = veterinarianClinicSchema.omit({
  id: true,
});

export type VeterinarianClinic = z.infer<typeof veterinarianClinicSchema>;
export type CreateVeterinarianClinic = z.infer<
  typeof createVeterinarianClinicSchema
>;
