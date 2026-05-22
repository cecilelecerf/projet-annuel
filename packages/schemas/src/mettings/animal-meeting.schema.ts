import { z } from "zod";
import {
  ownedPetIdSchema,
  specialityIdSchema,
  veterinarianClinicIdSchema,
  veterinarianIdSchema,
} from "../ids";
import {
  createMeetingBaseSchema,
  meetingBaseSchema,
} from "./meeting-base.schema";
import { timeRefineFn, timeRefineOptions } from "./utils";
import { ownedPetMetaSchema } from "../owned-pet.schema";

export const animalMeetingSchema = meetingBaseSchema.extend({
  description: z.string().nullable().optional(),
  petWeight: z.coerce.number().multipleOf(0.01).nullable().optional(),
  petSize: z.coerce.number().multipleOf(0.01).nullable().optional(),
  report: z.string().nullable().optional(),
  specialityId: specialityIdSchema.nullable().optional(),
  ownedPetId: ownedPetIdSchema,
  veterinarianClinicId: veterinarianClinicIdSchema,
  kind: z.literal("ANIMAL"),
});

export const animalMeetingMetaSchema = animalMeetingSchema.extend({
  ownedPet: ownedPetMetaSchema,
});

const createAnimalMeetingBaseFields = animalMeetingSchema.pick({
  description: true,
  specialityId: true,
  ownedPetId: true,
  veterinarianClinicId: true,
  petSize: true,
  petWeight: true,
  report: true,
});

const createAnimalMeetingFields = createMeetingBaseSchema
  .omit({ kind: true, type: true })
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
  .omit({ veterinarianId: true, ownedPetId: true })
  .partial()
  .refine(timeRefineFn, timeRefineOptions);

export type AnimalMeeting = z.infer<typeof animalMeetingSchema>;
export type CreateAnimalMeeting = z.infer<typeof createAnimalMeetingSchema>;
export type UpdateAnimalMeeting = z.infer<typeof updateAnimalMeetingSchema>;
