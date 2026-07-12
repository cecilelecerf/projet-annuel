import { z } from "zod";
import {
  actIdSchema,
  animalIdSchema,
  clinicActIdSchema,
  medicalHistoryIdSchema,
  meetingIdSchema,
  veterinarianClinicIdSchema,
} from "../ids";
import { clinicActSchema } from "../clinics/clinic-act.schema";
import { createSurgerySchema, surgerySchema } from "./surgery.schema";
import {
  createHospitalizationSchema,
  hospitalizationSchema,
} from "./hospitalization.schema";
import { createImagingSchema, imagingSchema } from "./imaging.schema";
import { analysisSchema, createAnalysisSchema } from "./analysis.schema";
import {
  createAnimalVaccineSchema,
  animalVaccineSchema,
} from "./animal-vaccination.schema";
import { actSchema } from "./act.schema";
import { veterinarianClinicMetaSchema } from "../clinics/veterinarian-clinic.schema";

export const medicalHistorySchema = z.object({
  id: medicalHistoryIdSchema,
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  performedAt: z.coerce.date(),
  animalId: animalIdSchema,
  notes: z.string().nullable(),
  priceApplied: z.coerce.number().multipleOf(0.01),
  animalMeetingId: meetingIdSchema.nullable(),
  clinicActId: clinicActIdSchema.nullable(),
  clinicAct: clinicActSchema.nullable(),
  actId: actIdSchema.nullable(),
  surgery: surgerySchema.nullable(),
  hospitalization: hospitalizationSchema.nullable(),
  imaging: imagingSchema.nullable(),
  analysis: analysisSchema.nullable(),
  performedById: veterinarianClinicIdSchema.nullable(),
  animalVaccine: animalVaccineSchema.nullable(),
});
export const medicalHistoryMetaSchema = medicalHistorySchema.extend({
  act: actSchema.nullable(),
  performedBy: veterinarianClinicMetaSchema.nullable(),
});

export const createMeetingMedicalHistorySchema = medicalHistorySchema
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    clinicAct: true,
    priceApplied: true,
    animalId: true,
    actId: true,
    performedById: true,
    notes: true,
  })
  .extend({
    surgery: createSurgerySchema.optional(),
    hospitalization: createHospitalizationSchema.optional(),
    imaging: createImagingSchema.optional(),
    analysis: createAnalysisSchema.optional(),
    vaccination: createAnimalVaccineSchema.optional(),
    animalVaccine: animalVaccineSchema.optional(),
    priceApplied: medicalHistorySchema.shape.priceApplied.optional(),
    notes: medicalHistorySchema.shape.notes.optional(),

    type: z.literal("meeting"),
  });

export const createFreeMedicalHistorySchema = medicalHistorySchema
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    clinicAct: true,
    priceApplied: true,
    performedById: true,
    clinicActId: true,
    animalMeetingId: true,
    notes: true,
    animalVaccine: true,
  })
  .extend({
    surgery: createSurgerySchema.optional(),
    hospitalization: createHospitalizationSchema.optional(),
    imaging: createImagingSchema.optional(),
    analysis: createAnalysisSchema.optional(),
    vaccination: createAnimalVaccineSchema.optional(),
    animalVaccine: animalVaccineSchema.optional(),
    type: z.literal("free"),
    notes: medicalHistorySchema.shape.notes.optional(),
  });

export const createMedicalHistorySchema = z.discriminatedUnion("type", [
  createFreeMedicalHistorySchema,
  createMeetingMedicalHistorySchema,
]);

export type MedicalHistory = z.infer<typeof medicalHistorySchema>;
export type MedicalHistoryMeta = z.infer<typeof medicalHistoryMetaSchema>;
export type CreateMettingMedicalHistory = z.infer<
  typeof createMeetingMedicalHistorySchema
>;
export type CreateFreeMedicalHistory = z.infer<
  typeof createFreeMedicalHistorySchema
>;
export type CreateMedicalHistory = z.infer<typeof createMedicalHistorySchema>;

export const updateFreeMedicalHistorySchema = createFreeMedicalHistorySchema
  .omit({ animalId: true, actId: true })
  .partial()
  .required({ type: true });

export const updateMeetingMedicalHistorySchema =
  createMeetingMedicalHistorySchema
    .omit({ animalMeetingId: true, clinicActId: true, priceApplied: true })
    .partial()
    .required({ type: true });

export const updateMedicalHistorySchema = z.discriminatedUnion("type", [
  updateFreeMedicalHistorySchema,
  updateMeetingMedicalHistorySchema,
]);

export type UpdateMedicalHistory = z.infer<typeof updateMedicalHistorySchema>;
