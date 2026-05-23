import { z } from "zod";
import {
  clinicActIdSchema,
  animalMeetingActIdSchema,
  veterinarianIdSchema,
  meetingIdSchema,
} from "../ids";
import { clinicActSchema } from "./clinic-act.schema";
import { createSurgerySchema, surgerySchema } from "./surgery.schema";
import {
  createHospitalizationSchema,
  hospitalizationSchema,
} from "./hospitalization.schema";
import { createImagingSchema, imagingSchema } from "./imaging.schema";
import { analysisSchema, createAnalysisSchema } from "./analysis.schema";
import { veterinarianProfileSchema, veterinarianSchema } from "../users";

export const animalMeetingActSchema = z.object({
  id: animalMeetingActIdSchema,
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  performedAt: z.coerce.date(),
  notes: z.string().nullable().optional(),
  priceApplied: z.coerce.number().multipleOf(0.01),
  animalMeetingId: meetingIdSchema,
  clinicActId: clinicActIdSchema,
  clinicAct: clinicActSchema.optional(),
  surgery: surgerySchema.nullable().optional(),
  hospitalization: hospitalizationSchema.nullable().optional(),
  imaging: imagingSchema.nullable().optional(),
  analysis: analysisSchema.nullable().optional(),
  performedBy: z
    .array(
      z.object({
        id: z.uuid(),
        veterinarianId: veterinarianIdSchema,
        veterinarian: veterinarianProfileSchema.extend({
          user: veterinarianSchema,
        }),
      }),
    )
    .optional(),
});

export const createAnimalMeetingActSchema = animalMeetingActSchema
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    clinicAct: true,
    performedBy: true,
  })
  .extend({
    surgery: createSurgerySchema.optional(),
    hospitalization: createHospitalizationSchema.optional(),
    imaging: createImagingSchema.optional(),
    analysis: createAnalysisSchema.optional(),
    performedByIds: z.array(veterinarianIdSchema).optional(),
  });

export const updateAnimalMeetingActSchema = createAnimalMeetingActSchema
  .omit({ animalMeetingId: true })
  .partial();

export type AnimalMeetingAct = z.infer<typeof animalMeetingActSchema>;
export type CreateAnimalMeetingAct = z.infer<
  typeof createAnimalMeetingActSchema
>;
export type UpdateAnimalMeetingAct = z.infer<
  typeof updateAnimalMeetingActSchema
>;
