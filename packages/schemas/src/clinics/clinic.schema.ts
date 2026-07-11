import { z } from "zod";
import {
  clinicIdSchema,
  veterinarianIdSchema,
  veterinarianClinicIdSchema,
  specialityIdSchema,
  directorClinicIdSchema,
} from "../ids";
import { baseUserSchema } from "../users/base-user.schema";
import { veterinarianProfileSchema } from "../users/veterinarian.schema";

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
  createdAt: z.coerce.date(),
  directorId: directorClinicIdSchema,
});

export const createClinicSchema = clinicSchema.omit({ id: true });
export const updateClinicSchema = createClinicSchema.partial();

export const updateClinicReferentSchema = z.object({
  name: z.string().min(1, "Nom requis").optional(),
  address: z.string().min(1, "Adresse requise").optional(),
  phone: z.string().min(10, "Téléphone invalide").optional(),
  website: z.string().min(1, "Site web requis").optional(),
  description: z.string().max(500).nullable().optional(),
  openingHours: z.string().max(500).nullable().optional(),
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
