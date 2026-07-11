import { z } from "zod";
import { veterinarianIdSchema, clinicIdSchema } from "../ids";
import { baseUserSchema, registerSchema } from "./base-user.schema";
import { specialitySchema, veterinarianClinicSchema } from "../clinic.schema";

// Numéro de licence/ordre vétérinaire : lettres, chiffres et tirets uniquement.
export const licenseNumberSchema = z
  .string()
  .trim()
  .min(4, "Numéro de licence trop court (4 caractères minimum)")
  .max(50)
  .regex(
    /^[A-Za-z0-9-]+$/,
    "Le numéro de licence ne doit contenir que des lettres, chiffres et tirets",
  );

export const veterinarianProfileSchema = z.object({
  id: veterinarianIdSchema,
  licenseNumber: z.string().max(50),
  bio: z.string().nullable().optional(),
  speciality: z.array(specialitySchema).optional(),
  veterinarianClinic: z.array(veterinarianClinicSchema).optional(),
});

export const veterinarianSchema = baseUserSchema.extend({
  role: z.literal("VETERINARIAN"),
  veterinarianProfile: veterinarianProfileSchema.nullable().optional(),
  clinicId: clinicIdSchema.nullable().optional(),
});

export const createVeterinarianSchema = veterinarianProfileSchema.omit({
  id: true,
  speciality: true,
  veterinarianClinic: true,
});
export const updateVeterinarianSchema = createVeterinarianSchema.partial();

// Compte créé par un directeur/référent : le mot de passe est généré et envoyé
// par email, il n'est plus saisi par la personne qui crée le compte.
export const createVeterinarianStaffSchema = registerSchema
  .omit({ password: true })
  .extend({
    licenseNumber: licenseNumberSchema,
    bio: z.string().max(500).optional(),
  });
export type CreateVeterinarianStaff = z.infer<
  typeof createVeterinarianStaffSchema
>;

export const linkVeterinarianStaffSchema = z.object({
  veterinarianId: veterinarianIdSchema,
});
export type LinkVeterinarianStaff = z.infer<
  typeof linkVeterinarianStaffSchema
>;

export type VeterinarianProfile = z.infer<typeof veterinarianProfileSchema>;
export type Veterinarian = z.infer<typeof veterinarianSchema>;
export type CreateVeterinarian = z.infer<typeof createVeterinarianSchema>;
export type UpdateVeterinarian = z.infer<typeof updateVeterinarianSchema>;
