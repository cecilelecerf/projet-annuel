import { z } from "zod";
import { imagingIdSchema } from "../ids";
import { imagingTypeSchema } from "./act.schema";

export const imagingSchema = z.object({
  id: imagingIdSchema,
  imagingType: imagingTypeSchema,
  bodyPart: z.string().max(100).nullable().optional(),
  findings: z.string().nullable().optional(),
  fileUrl: z.url().nullable().optional(),
});

export const createImagingSchema = imagingSchema.omit({ id: true });
export const updateImagingSchema = createImagingSchema.partial();

export type Imaging = z.infer<typeof imagingSchema>;
