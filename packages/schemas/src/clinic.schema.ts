import { z } from "zod";
import {
  clinicIdSchema,
  veterinarianIdSchema,
  veterinarianClinicIdSchema,
  availabilityIdSchema,
  specialityIdSchema,
} from "./ids";

// ── Clinic ────────────────────────────────────────────────────────────────────
export const clinicSchema = z.object({
  id: clinicIdSchema,
  adress: z.string().min(1),
  description: z.string().max(255).nullable().optional(),
  websiteUrl: z.string().url().max(255),
  picture: z.string().url().nullable().optional(),
});

export const createClinicSchema = clinicSchema.omit({ id: true });
export const updateClinicSchema = createClinicSchema.partial();

export type Clinic = z.infer<typeof clinicSchema>;
export type CreateClinic = z.infer<typeof createClinicSchema>;
export type UpdateClinic = z.infer<typeof updateClinicSchema>;

// ── VeterinarianClinic (junction) ─────────────────────────────────────────────
export const veterinarianClinicSchema = z.object({
  id: veterinarianClinicIdSchema,
  veterinarianId: veterinarianIdSchema,
  clinicId: clinicIdSchema,
});

export const createVeterinarianClinicSchema = veterinarianClinicSchema.omit({
  id: true,
});

export type VeterinarianClinic = z.infer<typeof veterinarianClinicSchema>;
export type CreateVeterinarianClinic = z.infer<
  typeof createVeterinarianClinicSchema
>;

// ── VeterinarianClinicAvailability ────────────────────────────────────────────
export const availabilityTypeSchema = z.enum([
  "recurring",
  "specified",
  "exception",
]);

// ── Speciality ────────────────────────────────────────────────────────────────
export const specialitySchema = z.object({
  id: specialityIdSchema,
  name: z.string().min(1).max(255),
  description: z.string().min(1).max(255),
});

export const createSpecialitySchema = specialitySchema.omit({ id: true });
export const updateSpecialitySchema = createSpecialitySchema.partial();

export type Speciality = z.infer<typeof specialitySchema>;
export type CreateSpeciality = z.infer<typeof createSpecialitySchema>;
export type UpdateSpeciality = z.infer<typeof updateSpecialitySchema>;
