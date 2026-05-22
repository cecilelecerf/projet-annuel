import z from "zod";
import { userIdSchema } from "../ids";
export const userRoleSchema = z.enum([
  "CLIENT",
  "SECRETARY",
  "DIRECTOR",
  "REFERANT",
  "VETERINARIAN",
  "ADMIN",
]);
export type UserRole = z.infer<typeof userRoleSchema>;

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
