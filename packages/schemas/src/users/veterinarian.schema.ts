import { z } from "zod";
import { veterinarianIdSchema, clinicIdSchema } from "../ids";
import { baseUserSchema } from "./base-user.schema";
import { specialitySchema } from "../specilities.schema";
import { veterinarianClinicSchema } from "../clinics/veterinarian-clinic.schema";

export const veterinarianProfileSchema = z.object({
  id: veterinarianIdSchema,
  licenseNumber: z.string().max(50),
  bio: z.string().nullable().optional(),
  speciality: z.array(specialitySchema).optional(),
  // veterinarianClinics: z.array(veterinarianClinicSchema).optional(),
});

export const veterinarianSchema = baseUserSchema.extend({
  role: z.literal("VETERINARIAN"),
  veterinarianProfile: veterinarianProfileSchema.nullable().optional(),
  clinicId: clinicIdSchema.nullable().optional(),
});

export const veterinarianIdentityInputSchema = z.object({
  birthCity: z.string().optional(),
  birthDepartment: z.string().optional(),
  birthCountry: z.string().optional(),
  nationality: z.string().optional(),
  inseNumber: z.string().optional(),
  diploma: z.string().optional(),
  diplomaObtainedAt: z.string().datetime().optional(),
  rppsNumber: z.string().optional(),
  orderRegisteredAt: z.string().datetime().optional(),
  practiceAuthorization: z.boolean().optional(),
  proPhone: z.string().optional(),
});

export const createVeterinarianSchema = veterinarianProfileSchema.omit({
  id: true,
  speciality: true,
  // veterinarianClinics: true,
});
export const updateVeterinarianSchema = createVeterinarianSchema.partial();

export type VeterinarianIdentityInput = z.infer<
  typeof veterinarianIdentityInputSchema
>;

export type VeterinarianProfile = z.infer<typeof veterinarianProfileSchema>;
export type Veterinarian = z.infer<typeof veterinarianSchema>;
export type CreateVeterinarian = z.infer<typeof createVeterinarianSchema>;
export type UpdateVeterinarian = z.infer<typeof updateVeterinarianSchema>;
