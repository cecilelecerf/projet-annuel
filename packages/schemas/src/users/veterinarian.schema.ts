import { z } from "zod";
import { veterinarianIdSchema, clinicIdSchema, specialityIdSchema } from "../ids";
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

export const bankingInfoInputSchema = z.object({
  iban: z.string().optional(),
  bic: z.string().optional(),
  domiciliation: z.string().optional(),
  beneficiary: z.string().optional(),
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
  veterinarianClinics: true,
});
export const updateVeterinarianSchema = createVeterinarianSchema.partial();
export const createVeterinarianStaffSchema = registerSchema.extend({
  licenseNumber: z.string().min(1, "Numéro de licence requis"),
  bio: z.string().max(500).optional(),
  specialityIds: z.array(specialityIdSchema).optional(),
  identity: veterinarianIdentityInputSchema.optional(),
  bankingInfo: bankingInfoInputSchema.optional(),
});

export type BankingInfoInput = z.infer<typeof bankingInfoInputSchema>;
export type VeterinarianIdentityInput = z.infer<
  typeof veterinarianIdentityInputSchema
>;
export type CreateVeterinarianStaff = z.infer<
  typeof createVeterinarianStaffSchema
>;

export type VeterinarianProfile = z.infer<typeof veterinarianProfileSchema>;
export type Veterinarian = z.infer<typeof veterinarianSchema>;
export type CreateVeterinarian = z.infer<typeof createVeterinarianSchema>;
export type UpdateVeterinarian = z.infer<typeof updateVeterinarianSchema>;
