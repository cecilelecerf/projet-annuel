import { z } from "zod";
import { actIdSchema, vaccineIdSchema } from "../ids";
import { minVaccineSchema } from "./vaccine/vaccine.schema";

// ── Enums ─────────────────────────────────────────────────────────────────────

export const actTypeSchema = z.enum([
  "VACCINATION",
  "SURGERY",
  "HOSPITALIZATION",
  "IMAGING",
  "ANALYSIS",
  "NURSING",
  "CONSULTATION",
]);

export const anesthesiaTypeSchema = z.enum(["LOCAL", "GENERAL", "SEDATION"]);
export const imagingTypeSchema = z.enum([
  "XRAY",
  "ULTRASOUND",
  "SCANNER",
  "MRI",
]);
export const analysisTypeSchema = z.enum([
  "BLOOD",
  "URINE",
  "STOOL",
  "BIOPSY",
  "CYTOLOGY",
  "OTHER",
]);
export const analysisStatusSchema = z.enum(["PENDING", "RECEIVED"]);

// ── Act ───────────────────────────────────────────────────────────────────────

export const actSchema = z.object({
  id: actIdSchema,
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  name: z.string().min(1).max(255),
  description: z.string().nullable().optional(),
  type: actTypeSchema,
  basePrice: z.coerce.number().multipleOf(0.01),
  vaccineId: vaccineIdSchema.nullable().optional(),
  vaccine: minVaccineSchema.nullable().optional(),
});

export const createActSchema = actSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  vaccine: true,
});
export const updateActSchema = createActSchema.partial();

export type ActType = z.infer<typeof actTypeSchema>;
export type Act = z.infer<typeof actSchema>;
export type CreateAct = z.infer<typeof createActSchema>;
export type UpdateAct = z.infer<typeof updateActSchema>;
