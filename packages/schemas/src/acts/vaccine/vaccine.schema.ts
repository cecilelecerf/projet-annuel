import z from "zod";
import { petIdSchema, vaccineIdSchema } from "../../ids";
import { actSchema } from "../act.schema";

export const vaccineRuleTypeSchema = z.enum(["MANDATORY", "RECOMMENDED"]);

export const vaccineCountryRuleSchema = z.object({
  id: z.string(),
  country: z.string().length(2), // code ISO (FR, BE, CH...)
  minAge: z.number().int().min(0),
  type: vaccineRuleTypeSchema,
});

export const createVaccineCountryRuleSchema = vaccineCountryRuleSchema.omit({
  id: true,
});

// ── Vaccine ───────────────────────────────────────────────────────────────────

export const vaccineSchema = z.object({
  id: vaccineIdSchema,
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  recommendedAge: z.number().int().min(0),
  boosterInterval: z.number().int().min(0),
  petId: petIdSchema,
  countryRules: vaccineCountryRuleSchema.array(),
  act: actSchema,
});

// ── Create : acte + vaccin en une seule opération ───────────────────────────

export const createVaccineSchema = z.object({
  // Champs de l'acte (créé en même temps)
  name: z.string().min(1).max(255),
  description: z.string().nullable().optional(),
  basePrice: z.coerce.number().multipleOf(0.01),

  // Champs du vaccin
  recommendedAge: z.number().int().min(0),
  boosterInterval: z.number().int().min(0),
  petId: petIdSchema,

  // Règles par pays
  countryRules: createVaccineCountryRuleSchema.array().min(1),
});

export const updateVaccineSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().nullable().optional(),
  basePrice: z.coerce.number().multipleOf(0.01).optional(),
  recommendedAge: z.number().int().min(0).optional(),
  boosterInterval: z.number().int().min(0).optional(),
  countryRules: createVaccineCountryRuleSchema.array().optional(),
});

export type VaccineRuleType = z.infer<typeof vaccineRuleTypeSchema>;
export type VaccineCountryRule = z.infer<typeof vaccineCountryRuleSchema>;
export type CreateVaccineCountryRule = z.infer<
  typeof createVaccineCountryRuleSchema
>;
export type Vaccine = z.infer<typeof vaccineSchema>;
export type CreateVaccine = z.infer<typeof createVaccineSchema>;
export type UpdateVaccine = z.infer<typeof updateVaccineSchema>;
