import { z } from "zod";
import { clientIdSchema } from "../ids";
import { baseUserSchema } from "./base-user.schema";

export const clientProfileSchema = z.object({
  id: clientIdSchema,
  dateOfBirth: z.coerce.date().nullable().optional(),
  address: z.string().max(500).nullable().optional(),
  phone: z.string().max(20).nullable().optional(),
});

export const clientSchema = baseUserSchema.extend({
  role: z.literal("CLIENT"),
  clientProfile: clientProfileSchema.nullable().optional(),
});

export const createClientSchema = clientProfileSchema.omit({ id: true });
export const updateClientSchema = createClientSchema.partial();

export type ClientProfile = z.infer<typeof clientProfileSchema>;
export type Client = z.infer<typeof clientSchema>;
export type CreateClient = z.infer<typeof createClientSchema>;
export type UpdateClient = z.infer<typeof updateClientSchema>;
