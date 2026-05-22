import z from "zod";
import { veterinarianIdSchema } from "../ids";
import { baseUserSchema } from "./base-user.schema";

export const veterinarianSchema = baseUserSchema.extend({
  id: veterinarianIdSchema,
  role: z.literal("VETERINARIAN"),
});

export type Veterinarian = z.infer<typeof veterinarianSchema>;
