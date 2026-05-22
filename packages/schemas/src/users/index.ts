import { z } from "zod";

import { clientSchema } from "./client.schema";
import { directorClinicSchema } from "./director.schema";
import { referantClinicSchema } from "./referant.schema";
import { secretarySchema } from "./secretary.schema";
import { veterinarianSchema } from "./veterinarian.schema";
import { baseUserSchema } from "./base-user.schema";

export const userSchema = z.discriminatedUnion("role", [
  clientSchema,
  directorClinicSchema,
  referantClinicSchema,
  secretarySchema,
  veterinarianSchema,
]);
export type User = z.infer<typeof userSchema>;

// Auth
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
export * from "./veterinarian.schema";
export * from "./client.schema";
export * from "./director.schema";
export * from "./secretary.schema";
export * from "./referant.schema";
