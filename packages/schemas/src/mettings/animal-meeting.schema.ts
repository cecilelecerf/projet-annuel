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

const createAnimalMeetingBaseFields = animalMeetingSchema.pick({
  description: true,
  specialityId: true,
  ownedPetId: true,
  veterinarianClinicId: true,
});

export const createAnimalMeetingSchema = createMeetingBaseSchema
  .omit({ kind: true, type: true })
  .extend(createAnimalMeetingBaseFields.shape);

export const updateAnimalMeetingSchema = createAnimalMeetingSchema
  .omit({ ownedPetId: true, veterinarianClinicId: true })
  .partial()
  .extend({
    petWeight: z.coerce.number().multipleOf(0.01).nullable().optional(),
    petSize: z.coerce.number().multipleOf(0.01).nullable().optional(),
    report: z.string().nullable().optional(),
  });

export type AnimalMeeting = z.infer<typeof animalMeetingSchema>;
export type CreateAnimalMeeting = z.infer<typeof createAnimalMeetingSchema>;
export type UpdateAnimalMeeting = z.infer<typeof updateAnimalMeetingSchema>;
