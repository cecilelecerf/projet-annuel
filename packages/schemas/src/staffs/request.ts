import z from "zod";
import {
  bankingInfoInputSchema,
  registerSchema,
} from "../users/base-user.schema";
import { specialityIdSchema } from "../ids";
import { veterinarianIdentityInputSchema } from "../users";

export const createReferentStaffSchema = registerSchema;
export type CreateReferentStaff = z.infer<typeof createReferentStaffSchema>;

export const createSecretaryStaffSchema = registerSchema.extend({
  bankingInfo: bankingInfoInputSchema.optional(),
});
export type CreateSecretaryStaff = z.infer<typeof createSecretaryStaffSchema>;

export const createVeterinarianStaffSchema = registerSchema.extend({
  licenseNumber: z.string().min(1, "Numéro de licence requis"),
  bio: z.string().max(500).optional(),
  specialityIds: z.array(specialityIdSchema).optional(),
  identity: veterinarianIdentityInputSchema.optional(),
  bankingInfo: bankingInfoInputSchema.optional(),
});
export type CreateVeterinarianStaff = z.infer<
  typeof createVeterinarianStaffSchema
>;
