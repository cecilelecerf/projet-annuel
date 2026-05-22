import z from "zod";
import { clinicIdSchema, secretaryIdSchema } from "../ids";
import { baseUserSchema } from "./base-user.schema";

export const secretarySchema = baseUserSchema.extend({
  id: secretaryIdSchema,
  clinicId: clinicIdSchema,
  role: z.literal("SECRETARY"),
});

export const createSecretarySchema = secretarySchema.omit({ id: true });

export type Secretary = z.infer<typeof secretarySchema>;
export type CreateSecretary = z.infer<typeof createSecretarySchema>;
