import { z } from "zod";
import {
  clinicIdSchema,
  userIdSchema,
  veterinarianClinicIdSchema,
} from "../ids";
import {
  createMeetingBaseSchema,
  meetingBaseSchema,
} from "./meeting-base.schema";

export const availabilitiesSchema = meetingBaseSchema.extend({
  veterinarianClinicId: veterinarianClinicIdSchema.nullable(),
  userId: userIdSchema.nullable(),
  kind: z.literal("AVAILABILITY"),
});

const createAvailabilitiesMeetingBaseSchema = availabilitiesSchema
  .omit({
    kind: true,
    veterinarianClinicId: true,
    userId: true,
    createdAt: true,
    updatedAt: true,
    id: true,
    type: true,
  })
  .extend({ clinicId: clinicIdSchema.optional() });

export const createAvailabilitySchema = createMeetingBaseSchema
  .omit({ kind: true, type: true })
  .extend(createAvailabilitiesMeetingBaseSchema.shape);

export const updateAvailabilitySchema = createAvailabilitySchema.partial();

export type CreateAvailability = z.infer<typeof createAvailabilitySchema>;
export type UpdateAvailability = z.infer<typeof updateAvailabilitySchema>;
