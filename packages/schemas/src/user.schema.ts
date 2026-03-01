import { z } from "zod";
import {
  userIdSchema,
  clientIdSchema,
  veterinarianIdSchema,
  secretaryIdSchema,
  directorClinicIdSchema,
  referantClinicIdSchema,
  clinicIdSchema,
} from "./ids";

export const userRoleSchema = z.enum([
  "CLIENT",
  "SECRETARY",
  "DIRECTOR",
  "REFERANT",
  "VETERINARIAN",
  "ADMIN",
]);
export type UserRole = z.infer<typeof userRoleSchema>;

// ── User (base) ───────────────────────────────────────────────────────────────
export const baseUserSchema = z.object({
  id: userIdSchema,
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  email: z.email("Email invalide").max(255),
  lastname: z.string().min(1, "Nom requis").max(255),
  firstname: z.string().min(1, "Prénom requis").max(255),
  picture: z.url().max(255).nullable().optional(),
  role: userRoleSchema,
});

export const createUserSchema = baseUserSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const updateUserSchema = createUserSchema
  .partial()
  .required({ email: true });

export type BaseUser = z.infer<typeof baseUserSchema>;
export type CreateUser = z.infer<typeof createUserSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;

// ── Client ────────────────────────────────────────────────────────────────────
export const clientSchema = baseUserSchema.extend({
  id: clientIdSchema,
  dateOfBirth: z.coerce.date().nullable().optional(),
  role: z.literal("CLIENT"),
});

export const createClientSchema = clientSchema.omit({ id: true });
export const updateClientSchema = createClientSchema.partial();

export type Client = z.infer<typeof clientSchema>;
export type CreateClient = z.infer<typeof createClientSchema>;
export type UpdateClient = z.infer<typeof updateClientSchema>;

// ── Veterinarian ──────────────────────────────────────────────────────────────
export const veterinarianSchema = baseUserSchema.extend({
  id: veterinarianIdSchema,
  role: z.literal("VETERINARIAN"),
});

export type Veterinarian = z.infer<typeof veterinarianSchema>;

// ── Secretary ─────────────────────────────────────────────────────────────────
export const secretarySchema = baseUserSchema.extend({
  id: secretaryIdSchema,
  clinicId: clinicIdSchema,
  role: z.literal("SECRETARY"),
});

export const createSecretarySchema = secretarySchema.omit({ id: true });

export type Secretary = z.infer<typeof secretarySchema>;
export type CreateSecretary = z.infer<typeof createSecretarySchema>;

// ── Director Clinic ───────────────────────────────────────────────────────────
export const directorClinicSchema = baseUserSchema.extend({
  id: directorClinicIdSchema,
  clinicId: clinicIdSchema,
  role: z.literal("DIRECTOR"),
});

export const createDirectorClinicSchema = directorClinicSchema.omit({
  id: true,
});

export type DirectorClinic = z.infer<typeof directorClinicSchema>;
export type CreateDirectorClinic = z.infer<typeof createDirectorClinicSchema>;

// ── Referant Clinic ───────────────────────────────────────────────────────────
export const referantClinicSchema = baseUserSchema.extend({
  id: referantClinicIdSchema,
  clinicId: clinicIdSchema.nullable().optional(),
  role: z.literal("REFERANT"),
});

export const createReferantClinicSchema = referantClinicSchema.omit({
  id: true,
});

export type ReferantClinic = z.infer<typeof referantClinicSchema>;
export type CreateReferantClinic = z.infer<typeof createReferantClinicSchema>;

export const userSchema = z.discriminatedUnion("role", [
  clientSchema,
  directorClinicSchema,
  referantClinicSchema,
  secretarySchema,
  veterinarianSchema,
]);
export type User = z.infer<typeof userSchema>;
const userPasswordSchema = z.string().min(8, "Minimum 8 caractères").max(255);
export const loginSchema = baseUserSchema
  .pick({ email: true })
  .extend({ password: userPasswordSchema });
export type Login = z.infer<typeof loginSchema>;
export const registerSchema = baseUserSchema
  .pick({
    email: true,
    firstname: true,
    lastname: true,
  })
  .extend({ password: userPasswordSchema });
export type Register = z.infer<typeof registerSchema>;
