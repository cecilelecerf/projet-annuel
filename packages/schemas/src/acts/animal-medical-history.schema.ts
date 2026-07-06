import { z } from "zod";
import {
  actIdSchema,
  clinicActIdSchema,
  clinicIdSchema,
  medicalHistoryIdSchema,
  meetingIdSchema,
  veterinarianIdSchema,
} from "../ids";
import { clinicActSchema } from "./clinic-act.schema";
import { createSurgerySchema, surgerySchema } from "./surgery.schema";
import {
  createHospitalizationSchema,
  hospitalizationSchema,
} from "./hospitalization.schema";
import { createImagingSchema, imagingSchema } from "./imaging.schema";
import { analysisSchema, createAnalysisSchema } from "./analysis.schema";
import { baseUserSchema, veterinarianProfileSchema } from "../users";
import {
  createAnimalVaccineSchema,
  animalVaccineSchema,
} from "./animal-vaccination.schema";

const performedUser = z.object({
  veterinarianId: veterinarianIdSchema,
  clinicId: clinicIdSchema,
  animalMedicalHistoryId: medicalHistoryIdSchema,
  veterinarian: veterinarianProfileSchema.extend({ user: baseUserSchema }),
});
export const medicalHistorySchema = z.object({
  id: medicalHistoryIdSchema,
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  performedAt: z.coerce.date(),
  notes: z.string().nullable().optional(),
  priceApplied: z.coerce.number().multipleOf(0.01),
  animalMeetingId: meetingIdSchema.nullable(),
  clinicActId: clinicActIdSchema.nullable().optional(),
  clinicAct: clinicActSchema.nullable().optional(),
  actId: actIdSchema.nullable().optional(),
  surgery: surgerySchema.nullable().optional(),
  hospitalization: hospitalizationSchema.nullable().optional(),
  imaging: imagingSchema.nullable().optional(),
  analysis: analysisSchema.nullable().optional(),
  performedBy: z.array(performedUser).optional(),
  animalVaccine: animalVaccineSchema.nullable().optional(),
});

export const createMedicalHistorySchema = medicalHistorySchema
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    clinicAct: true,
    performedBy: true,
    priceApplied: true,
    animalMeetingId: true,
  })
  .extend({
    surgery: createSurgerySchema.optional(),
    hospitalization: createHospitalizationSchema.optional(),
    imaging: createImagingSchema.optional(),
    analysis: createAnalysisSchema.optional(),
    performedByIds: z.array(veterinarianIdSchema).optional(),
    vaccination: createAnimalVaccineSchema.optional(),
    meetingId: meetingIdSchema,
    priceApplied: medicalHistorySchema.shape.priceApplied.optional(),
  });

export const updateMedicalHistorySchema = createMedicalHistorySchema
  .omit({ meetingId: true })
  .partial();

export type MedicalHistory = z.infer<typeof medicalHistorySchema>;
export type CreateMedicalHistory = z.infer<typeof createMedicalHistorySchema>;
export type UpdateMedicalHistory = z.infer<typeof updateMedicalHistorySchema>;
