import z from "zod";
import { veterinarianIdSchema } from "../ids";
import { baseUserSchema } from "./base-user.schema";

export const veterinarianSchema = baseUserSchema.extend({
  id: veterinarianIdSchema,
  role: z.literal("VETERINARIAN"),
});

export const veterinarianProfileSchema = z.object({
  id: z.uuid(),
  licenseNumber: z.string(),
  bio: z.string(),
});
export type Veterinarian = z.infer<typeof veterinarianSchema>;
