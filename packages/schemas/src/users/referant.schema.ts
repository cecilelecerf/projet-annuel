import z from "zod";
import { clinicIdSchema, referantClinicIdSchema } from "../ids";
import { baseUserSchema } from "./base-user.schema";

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
