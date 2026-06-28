import { z } from "zod";
import { referantClinicIdSchema, clinicIdSchema } from "../ids";
import { baseUserSchema } from "./base-user.schema";
import { registerSchema } from ".";

export const referantProfileSchema = z.object({
  id: referantClinicIdSchema,
  clinicId: clinicIdSchema.nullable().optional(),
});

export const referantSchema = baseUserSchema.extend({
  role: z.literal("REFERANT"),
  referentClinicProfile: referantProfileSchema.nullable().optional(),
  clinicId: clinicIdSchema.nullable().optional(),
});

export const createReferantSchema = referantProfileSchema.omit({ id: true });
export const updateReferantSchema = createReferantSchema.partial();
export const createReferentStaffSchema = registerSchema;
export type CreateReferentStaff = z.infer<typeof createReferentStaffSchema>;

export type ReferantProfile = z.infer<typeof referantProfileSchema>;
export type Referant = z.infer<typeof referantSchema>;
export type CreateReferant = z.infer<typeof createReferantSchema>;
export type UpdateReferant = z.infer<typeof updateReferantSchema>;
