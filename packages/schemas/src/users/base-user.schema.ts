import { z } from "zod";
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
  lastname: z.string().min(1).max(255),
  firstname: z.string().min(1).max(255),
  picture: z.url().max(255).nullable().optional(),
  role: userRoleSchema,
});

export type BaseUser = z.infer<typeof baseUserSchema>;
