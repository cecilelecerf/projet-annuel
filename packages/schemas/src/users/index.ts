import { z } from "zod";
import { clientSchema } from "./client.schema";
import { secretarySchema } from "./secretary.schema";
import { referentSchema } from "./referent.schema";
import { veterinarianSchema } from "./veterinarian.schema";
import { baseUserSchema, userPasswordSchema } from "./base-user.schema";
import { directorClinicSchema } from "./director.schema";

export const adminSchema = baseUserSchema.extend({
  role: z.literal("ADMIN"),
  clinicId: z.null().optional(),
});

export const userSchema = z.discriminatedUnion("role", [
  clientSchema,
  secretarySchema,
  directorClinicSchema,
  referentSchema,
  veterinarianSchema,
  adminSchema,
]);

export type User = z.infer<typeof userSchema>;
export type Admin = z.infer<typeof adminSchema>;

export const loginSchema = baseUserSchema
  .pick({ email: true })
  .extend({ password: userPasswordSchema });

export type Login = z.infer<typeof loginSchema>;

export const deleteAccountConfirmSchema = z.object({
  code: z.string().length(6, "Le code doit contenir 6 chiffres"),
});
export type DeleteAccountConfirm = z.infer<typeof deleteAccountConfirmSchema>;

export const forgotPasswordSchema = baseUserSchema.pick({ email: true });
export type ForgotPassword = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = baseUserSchema
  .pick({ email: true })
  .extend({
    code: z.string().length(6, "Le code doit contenir 6 chiffres"),
    newPassword: userPasswordSchema,
  });
export type ResetPassword = z.infer<typeof resetPasswordSchema>;

export const verifyLoginTwoFactorSchema = baseUserSchema
  .pick({ email: true })
  .extend({
    code: z.string().length(6, "Le code doit contenir 6 chiffres"),
  });
export type VerifyLoginTwoFactor = z.infer<typeof verifyLoginTwoFactorSchema>;

export * from "./base-user.schema";
export * from "./client.schema";
export * from "./veterinarian.schema";
export * from "./secretary.schema";
export * from "./referent.schema";
export * from "./director.schema";
