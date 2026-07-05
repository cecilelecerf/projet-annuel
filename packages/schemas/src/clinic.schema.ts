import { z } from "zod";
import {
  clinicIdSchema,
  veterinarianIdSchema,
  veterinarianClinicIdSchema,
  specialityIdSchema,
} from "./ids";
import { baseUserSchema, userSchema } from "./users";

// ── Clinic ────────────────────────────────────────────────────────────────────
export const clinicSchema = z.object({
  id: clinicIdSchema,
  name: z.string().min(1, "Nom requis"),
  address: z.string().min(1, "Adresse requise"),
  siret: z.string().length(14, "SIRET doit contenir 14 chiffres"),
  phone: z.string().min(10, "Téléphone invalide"),
  website: z.string().min(1, "Site web requis"),
  description: z.string().max(500).nullable().optional(),
  openingHours: z.string().max(500).nullable().optional(),
});

export const createClinicSchema = clinicSchema.omit({ id: true });
export const updateClinicSchema = createClinicSchema.partial();

export const updateClinicReferentSchema = z.object({
  address: z.string().min(1, "Adresse requise").optional(),
  openingHours: z.string().max(500).optional(),
});

export const createClinicRequestSchema = z.object({
  name: z.string().min(1, "Nom requis"),
  address: z.string().min(1, "Adresse requise"),
  siret: z.string().length(14, "SIRET doit contenir 14 chiffres"),
  phone: z.string().min(10, "Téléphone invalide"),
  website: z.string().min(1, "Site web requis"),
  description: z.string().max(500).optional(),
});

export type Clinic = z.infer<typeof clinicSchema>;
export type CreateClinic = z.infer<typeof createClinicSchema>;
export type UpdateClinic = z.infer<typeof updateClinicSchema>;
export type UpdateClinicReferent = z.infer<typeof updateClinicReferentSchema>;
export type CreateClinicRequest = z.infer<typeof createClinicRequestSchema>;

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

export const staffSchema = baseUserSchema.pick({
  id: true,
  lastname: true,
  firstname: true,
  email: true,
  role: true,
});
export type Staff = z.infer<typeof staffSchema>;
