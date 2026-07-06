import { z } from "zod";
import { referentClinicIdSchema, clinicIdSchema } from "../ids";
import { baseUserSchema } from "./base-user.schema";
import { registerSchema } from ".";

export const referentProfileSchema = z.object({
  id: referentClinicIdSchema,
  clinicId: clinicIdSchema.nullable().optional(),
});

export const referentSchema = baseUserSchema.extend({
  role: z.literal("REFERENT"),
  referentClinicProfile: referentProfileSchema.nullable().optional(),
  clinicId: clinicIdSchema.nullable().optional(),
});

export const createReferentSchema = referentProfileSchema.omit({ id: true });
export const updateReferentSchema = createReferentSchema.partial();
export const createReferentStaffSchema = registerSchema;
export type CreateReferentStaff = z.infer<typeof createReferentStaffSchema>;

export type ReferentProfile = z.infer<typeof referentProfileSchema>;
export type Referent = z.infer<typeof referentSchema>;
export type CreateReferent = z.infer<typeof createReferentSchema>;
export type UpdateReferent = z.infer<typeof updateReferentSchema>;
