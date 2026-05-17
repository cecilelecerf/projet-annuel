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
import { timeRefineFn, timeRefineOptions } from "./utils";

export const availabilitiesSchema = meetingBaseSchema.extend({
  clinicId: clinicIdSchema,
  userId: userIdSchema,
  kind: z.literal("AVAILABILITY"),
});

const createAvailabilitiesMeetingBaseSchema = availabilitiesSchema.omit({
  kind: true,
  clinicId: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
  id: true,
  type: true,
});

const createAvailabilityFields = createMeetingBaseSchema
  .omit({ kind: true, type: true })
  .extend(createAvailabilitiesMeetingBaseSchema.shape);
export const createAvailabilitySchema = createAvailabilityFields.refine(
  timeRefineFn,
  timeRefineOptions,
);
export const updateAvailabilitySchema = createAvailabilityFields
  .partial()
  .refine(timeRefineFn, timeRefineOptions);

export type CreateAvailability = z.infer<typeof createAvailabilitySchema>;
export type UpdateAvailability = z.infer<typeof updateAvailabilitySchema>;
