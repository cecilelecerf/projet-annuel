import { z } from "zod";
import { fileIdSchema, userIdSchema } from "../ids";

export const userRoleSchema = z.enum([
  "CLIENT",
  "SECRETARY",
  "DIRECTOR",
  "REFERENT",
  "VETERINARIAN",
  "ADMIN",
]);
export type UserRole = z.infer<typeof userRoleSchema>;

export const baseUserSchema = z.object({
  id: userIdSchema,
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  email: z.email("Email invalide").max(255),
  lastname: z.string().min(1).max(255),
  firstname: z.string().min(1).max(255),
  picture: z.url().max(255).nullable().optional(),
  role: userRoleSchema,
  avatarId: fileIdSchema.nullable(),
  avatarUrl: z.url().nullable(),
});

export type BaseUser = z.infer<typeof baseUserSchema>;
export const userPasswordSchema = z
  .string()
  .min(8, "Minimum 8 caractères")
  .max(255);

export const registerSchema = baseUserSchema
  .pick({
    email: true,
    firstname: true,
    lastname: true,
  })
  .extend({ password: userPasswordSchema });
export type Register = z.infer<typeof registerSchema>;

export const updateAccountSchema = baseUserSchema
  .pick({
    email: true,
    firstname: true,
    lastname: true,
  })
  .partial()
  .extend({
    currentPassword: z.string().min(1).optional(),
    newPassword: userPasswordSchema.optional(),
  })
  .refine((data) => !data.newPassword || !!data.currentPassword, {
    message: "Mot de passe actuel requis pour changer de mot de passe",
    path: ["currentPassword"],
  });
export type UpdateAccount = z.infer<typeof updateAccountSchema>;

export const bankingInfoInputSchema = z.object({
  iban: z.string().optional(),
  bic: z.string().optional(),
  domiciliation: z.string().optional(),
  beneficiary: z.string().optional(),
});
export type BankingInfoInput = z.infer<typeof bankingInfoInputSchema>;
