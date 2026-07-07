import { z } from "zod";
import { directorClinicIdSchema, clinicIdSchema } from "../ids";
import { baseUserSchema, registerSchema } from "./base-user.schema";
import { clinicSchema } from "../clinic.schema";

export const directorProfileSchema = z.object({
  id: directorClinicIdSchema,
  clinic: clinicSchema,
});
export const clinicRegistrationSchema = z.object({
  name: z.string().min(1, "Nom requis"),
  address: z.string().min(1, "Adresse requise"),
  siret: z.string().length(14, "SIRET doit contenir 14 chiffres"),
  phone: z.string().min(10, "Téléphone invalide"),
  website: z.string().min(1, "Site web requis"),
  description: z.string().max(500).optional(),
});
export type ClinicRegistration = z.infer<typeof clinicRegistrationSchema>;
export const registerDirectorSchema = registerSchema.extend({
  clinic: clinicRegistrationSchema,
});
export type RegisterDirectorSchema = z.infer<typeof registerDirectorSchema>;

export const directorClinicSchema = baseUserSchema.extend({
  id: directorClinicIdSchema,
  clinicId: clinicIdSchema,
  role: z.literal("DIRECTOR"),
});

export const createDirectorSchema = directorProfileSchema.omit({ id: true });
export const updateDirectorSchema = createDirectorSchema.partial();

export type DirectorProfile = z.infer<typeof directorProfileSchema>;
export type Director = z.infer<typeof directorClinicSchema>;
export type CreateDirector = z.infer<typeof createDirectorSchema>;
export type UpdateDirector = z.infer<typeof updateDirectorSchema>;
