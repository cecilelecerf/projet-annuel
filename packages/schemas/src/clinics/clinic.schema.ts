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

// ── Adresse ───────────────────────────────────────────────────────────────────
export const clinicAddressSchema = z.object({
  street: z.string().min(1, "Rue requise").max(255),
  postalCode: z.string().regex(/^\d{5}$/, "Code postal invalide (5 chiffres)"),
  city: z.string().min(1, "Ville requise").max(255),
  country: z.string().min(1).max(255).default("FR"),
});

// ── Horaires d'ouverture ───────────────────────────────────────────────────────
const timeStringSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Heure invalide (HH:mm)");

export const openingHoursDaySchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  openTime: timeStringSchema,
  closeTime: timeStringSchema,
  closed: z.boolean().default(false),
});

export const openingHoursSchema = z.array(openingHoursDaySchema).length(7);

export type ClinicAddress = z.infer<typeof clinicAddressSchema>;
export type OpeningHoursDay = z.infer<typeof openingHoursDaySchema>;
export type OpeningHours = z.infer<typeof openingHoursSchema>;

// Un SIRET est un identifiant à 14 chiffres (pas de lettres, pas d'espaces).
export const siretSchema = z
  .string()
  .regex(/^\d{14}$/, "Le SIRET doit contenir exactement 14 chiffres");

// ── Clinic ────────────────────────────────────────────────────────────────────
export const clinicSchema = z.object({
  id: clinicIdSchema,
  name: z.string().min(1, "Nom requis"),
  siret: siretSchema,
  phone: z.string().min(10, "Téléphone invalide"),
  website: z.string().min(1, "Site web requis"),
  description: z.string().max(500).nullable().optional(),
  openingHours: openingHoursSchema.nullable().optional(),
  image: z.string().nullable().optional(),
  lat: z.number(),
  lng: z.number(),
  createdAt: z.coerce.date(),
  directorId: directorClinicIdSchema,
}).extend(clinicAddressSchema.shape);

export const createClinicSchema = clinicSchema.omit({ id: true });
export const updateClinicSchema = createClinicSchema
  .omit({ createdAt: true, directorId: true })
  .partial();

export const updateClinicReferentSchema = clinicAddressSchema
  .partial()
  .extend({
    name: z.string().min(1, "Nom requis").optional(),
    phone: z.string().min(10, "Téléphone invalide").optional(),
    website: z.string().min(1, "Site web requis").optional(),
    description: z.string().max(500).nullable().optional(),
    openingHours: openingHoursSchema.optional(),
  });

export const createClinicRequestSchema = z
  .object({
    name: z.string().min(1, "Nom requis"),
    siret: siretSchema,
    phone: z.string().min(10, "Téléphone invalide"),
    website: z.string().min(1, "Site web requis"),
    description: z.string().max(500).optional(),
  })
  .extend(clinicAddressSchema.shape);

export type Clinic = z.infer<typeof clinicSchema>;
export type CreateClinic = z.infer<typeof createClinicSchema>;
export type UpdateClinic = z.infer<typeof updateClinicSchema>;
export type UpdateClinicReferent = z.infer<typeof updateClinicReferentSchema>;
export type CreateClinicRequest = z.infer<typeof createClinicRequestSchema>;
