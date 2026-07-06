import { z } from "zod";
import { veterinarianIdSchema, clinicIdSchema } from "../ids";
import { baseUserSchema, registerSchema } from "./base-user.schema";
import { specialitySchema, veterinarianClinicSchema } from "../clinic.schema";

export const veterinarianProfileSchema = z.object({
  id: veterinarianIdSchema,
  licenseNumber: z.string().max(50),
  bio: z.string().nullable().optional(),
  speciality: z.array(specialitySchema).optional(),
  veterinarianClinics: z.array(veterinarianClinicSchema).optional(),
});

export const veterinarianSchema = baseUserSchema.extend({
  role: z.literal("VETERINARIAN"),
  veterinarianProfile: veterinarianProfileSchema.nullable().optional(),
  clinicId: clinicIdSchema.nullable().optional(),
});

export const createVeterinarianSchema = veterinarianProfileSchema.omit({
  id: true,
  speciality: true,
  veterinarianClinics: true,
});
export const updateVeterinarianSchema = createVeterinarianSchema.partial();
export const createVeterinarianStaffSchema = registerSchema.extend({
  licenseNumber: z.string().min(1, "Numéro de licence requis"),
  bio: z.string().max(500).optional(),
});
export type CreateVeterinarianStaff = z.infer<
  typeof createVeterinarianStaffSchema
>;

export type VeterinarianProfile = z.infer<typeof veterinarianProfileSchema>;
export type Veterinarian = z.infer<typeof veterinarianSchema>;
export type CreateVeterinarian = z.infer<typeof createVeterinarianSchema>;
export type UpdateVeterinarian = z.infer<typeof updateVeterinarianSchema>;
