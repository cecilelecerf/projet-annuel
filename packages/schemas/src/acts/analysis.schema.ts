import { z } from "zod";
import { analysisIdSchema } from "../ids";
import { analysisStatusSchema, analysisTypeSchema } from "./act.schema";
export const analysisSchema = z.object({
  id: analysisIdSchema,
  analysisType: analysisTypeSchema,
  status: analysisStatusSchema,
  laboratory: z.string().max(255).nullable().optional(),
  sentAt: z.coerce.date().nullable().optional(),
  receivedAt: z.coerce.date().nullable().optional(),
  fileUrl: z.url().nullable().optional(),
  interpretation: z.string().nullable().optional(),
});

export const createAnalysisSchema = analysisSchema.omit({ id: true });
export const updateAnalysisSchema = createAnalysisSchema.partial();

export type Analysis = z.infer<typeof analysisSchema>;
