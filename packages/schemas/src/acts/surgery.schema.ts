import { z } from "zod";
import { surgeryIdSchema } from "../ids";
import { anesthesiaTypeSchema } from "./act.schema";

export const surgerySchema = z.object({
  id: surgeryIdSchema,
  anesthesiaType: anesthesiaTypeSchema,
  duration: z.number().int().nullable().optional(),
  complications: z.string().nullable().optional(),
  postOpInstructions: z.string().nullable().optional(),
});

export const createSurgerySchema = surgerySchema.omit({ id: true });
export const updateSurgerySchema = createSurgerySchema.partial();

export type Surgery = z.infer<typeof surgerySchema>;
