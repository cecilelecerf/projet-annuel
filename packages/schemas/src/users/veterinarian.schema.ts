import { z } from "zod";
import { veterinarianIdSchema, clinicIdSchema } from "../ids";
import { baseUserSchema } from "./base-user.schema";
import { specialitySchema, veterinarianClinicSchema } from "../clinic.schema";

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

export type VeterinarianProfile = z.infer<typeof veterinarianProfileSchema>;
export type Veterinarian = z.infer<typeof veterinarianSchema>;
export type CreateVeterinarian = z.infer<typeof createVeterinarianSchema>;
export type UpdateVeterinarian = z.infer<typeof updateVeterinarianSchema>;
