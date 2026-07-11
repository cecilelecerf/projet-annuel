import { z } from "zod";
import { secretaryIdSchema, clinicIdSchema } from "../ids";
import { baseUserSchema, registerSchema } from "./base-user.schema";

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

// Compte créé par un directeur/référent : le mot de passe est généré et
// envoyé par email, il n'est plus saisi par la personne qui crée le compte.
export const createSecretaryStaffSchema = registerSchema.omit({
  password: true,
});
export type CreateSecretaryStaff = z.infer<typeof createSecretaryStaffSchema>;

export type SecretaryProfile = z.infer<typeof secretaryProfileSchema>;
export type Secretary = z.infer<typeof secretarySchema>;
export type CreateSecretary = z.infer<typeof createSecretarySchema>;
export type UpdateSecretary = z.infer<typeof updateSecretarySchema>;
