import { z } from "zod";
import {
  animalIdSchema,
  specialityIdSchema,
  veterinarianClinicIdSchema,
  veterinarianIdSchema,
} from "../ids";
import {
  createMeetingBaseSchema,
  meetingBaseSchema,
} from "./meeting-base.schema";
import { timeRefineFn, timeRefineOptions } from "./utils";
import { animalMetaSchema } from "../animals/meta.schema";
import { specialitySchema } from "../clinic.schema";
export const animalMeetingFieldSchema = z.object({
  description: z.string().nullable().optional(),
  petWeight: z.coerce.number().multipleOf(0.01).nullable().optional(),
  petSize: z.coerce.number().multipleOf(0.01).nullable().optional(),
  report: z.string().nullable().optional(),
  specialityId: specialityIdSchema.nullable().optional(),
  animalId: animalIdSchema,
  veterinarianClinicId: veterinarianClinicIdSchema,
});
export const animalMeetingSchema = meetingBaseSchema.extend({
  ...animalMeetingFieldSchema.shape,
  kind: z.literal("ANIMAL"),
  speciality: specialitySchema.nullable(),
});

export const animalMeetingMetaSchema = animalMeetingSchema.extend({
  animal: animalMetaSchema,
});

export const animalMeetigWithMeetingSchema = animalMeetingSchema
  .pick({
    description: true,
    petSize: true,
    petWeight: true,
    report: true,
    specialityId: true,
    animalId: true,
    veterinarianClinicId: true,
  })
  .extend({ meeting: meetingBaseSchema });

const createAnimalMeetingBaseFields = animalMeetingSchema.pick({
  description: true,
  specialityId: true,
  animalId: true,
  veterinarianClinicId: true,
  petSize: true,
  petWeight: true,
  report: true,
});

export const createAnimalMeetingFields = createMeetingBaseSchema
  .omit({ kind: true, type: true, parentId: true })
  .extend(
    createAnimalMeetingBaseFields.omit({ veterinarianClinicId: true }).extend({
      veterinarianId: veterinarianIdSchema,
    }).shape,
  );

export const createAnimalMeetingSchema = createAnimalMeetingFields.refine(
  timeRefineFn,
  timeRefineOptions,
);
export const updateAnimalMeetingSchema = createAnimalMeetingFields
  .omit({ veterinarianId: true, animalId: true })
  .partial()
  .refine(timeRefineFn, timeRefineOptions);

export type AnimalMeetingMeta = z.infer<typeof animalMeetingMetaSchema>;
export type AnimalMeeting = z.infer<typeof animalMeetingSchema>;
export type CreateAnimalMeeting = z.infer<typeof createAnimalMeetingSchema>;
export type UpdateAnimalMeeting = z.infer<typeof updateAnimalMeetingSchema>;
