import { z } from "zod";
import { secretaryIdSchema, clinicIdSchema } from "../ids";
import { baseUserSchema } from "./base-user.schema";
import { registerSchema } from ".";

export const secretaryProfileSchema = z.object({
  id: secretaryIdSchema,
  clinicId: clinicIdSchema,
});

export const secretarySchema = baseUserSchema.extend({
  role: z.literal("SECRETARY"),
  secretaryProfile: secretaryProfileSchema.nullable().optional(),
  clinicId: clinicIdSchema.nullable().optional(),
});

export const createSecretarySchema = secretaryProfileSchema.omit({ id: true });
export const updateSecretarySchema = createSecretarySchema.partial();

export const createSecretaryStaffSchema = registerSchema;
export type CreateSecretaryStaff = z.infer<typeof createSecretaryStaffSchema>;

export type SecretaryProfile = z.infer<typeof secretaryProfileSchema>;
export type Secretary = z.infer<typeof secretarySchema>;
export type CreateSecretary = z.infer<typeof createSecretarySchema>;
export type UpdateSecretary = z.infer<typeof updateSecretarySchema>;
