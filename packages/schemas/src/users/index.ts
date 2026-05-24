import { z } from "zod";
import { clientSchema } from "./client.schema";
import { secretarySchema } from "./secretary.schema";
import { directorSchema } from "./director.schema";
import { referantSchema } from "./referant.schema";
import { veterinarianSchema } from "./veterinarian.schema";
import { baseUserSchema } from "./base-user.schema";

export const adminSchema = baseUserSchema.extend({
  role: z.literal("ADMIN"),
  clinicId: z.null().optional(),
});

export const userSchema = z.discriminatedUnion("role", [
  clientSchema,
  secretarySchema,
  directorSchema,
  referantSchema,
  veterinarianSchema,
  adminSchema,
]);

export type User = z.infer<typeof userSchema>;
export type Admin = z.infer<typeof adminSchema>;

const userPasswordSchema = z.string().min(8, "Minimum 8 caractères").max(255);

export const loginSchema = baseUserSchema
  .pick({ email: true })
  .extend({ password: userPasswordSchema });

export const registerSchema = baseUserSchema
  .pick({
    email: true,
    firstname: true,
    lastname: true,
  })
  .extend({ password: userPasswordSchema });
export type Login = z.infer<typeof loginSchema>;
export type Register = z.infer<typeof registerSchema>;

export * from "./base-user.schema";
export * from "./client.schema";
export * from "./veterinarian.schema";
export * from "./secretary.schema";
export * from "./referant.schema";
export * from "./director.schema";
