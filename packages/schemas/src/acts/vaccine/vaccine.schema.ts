import z from "zod";
import { petIdSchema, vaccineIdSchema } from "../../ids";

// ── Vaccine ───────────────────────────────────────────────────────────────────
export const minVaccineSchema = z.object({
  id: vaccineIdSchema,
  petId: petIdSchema,
  recommendedAge: z.number().int().positive(),
  boosterInterval: z.number().int().positive(),
  mandatoryCountry: z.array(z.string()).nullable().optional(),
  recommendedCountry: z.array(z.string()).nullable().optional(),
});

export const createVaccineSchema = minVaccineSchema.omit({ id: true });
export const updateVaccineSchema = createVaccineSchema.partial();

export type CreateVaccine = z.infer<typeof createVaccineSchema>;
export type UpdateVaccine = z.infer<typeof updateVaccineSchema>;
