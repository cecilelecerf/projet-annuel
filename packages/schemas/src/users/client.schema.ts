import z from "zod";
import { clientIdSchema } from "../ids";
import { baseUserSchema } from "./base-user.schema";

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
