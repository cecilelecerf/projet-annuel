import { z } from "zod";
import {
  clinicIdSchema,
  internalMeetingParticipantIdSchema,
  meetingIdSchema,
  userIdSchema,
} from "../ids";
import {
  createMeetingBaseSchema,
  meetingBaseSchema,
  meetingStatusSchema,
} from "./meeting-base.schema";
import { timeRefineFn, timeRefineOptions } from "./utils";

export const internalMeetingParticipantSchema = z.object({
  id: internalMeetingParticipantIdSchema,
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  internalMeetingId: meetingBaseSchema,
  userId: userIdSchema,
  status: meetingStatusSchema,
});

export const internalMeetingSchema = meetingBaseSchema.extend({
  title: z.string().max(255),
  description: z.string().nullable().optional(),
  clinicId: clinicIdSchema,
  participantIds: z.array(internalMeetingParticipantIdSchema).optional(),
  kind: z.literal("INTERNAL"),
});

const createInternalMeetingBaseFields = internalMeetingSchema
  .pick({
    description: true,
    title: true,
    clinicId: true,
    participantIds: true,
  })
  .partial({ clinicId: true });

const createInternalMeetingFields = createMeetingBaseSchema
  .omit({ kind: true, type: true })
  .extend(createInternalMeetingBaseFields.shape);

export const createInternalMeetingSchema = createMeetingBaseSchema
  .omit({ kind: true, type: true })
  .extend(createInternalMeetingBaseFields.shape)
  .refine(timeRefineFn, timeRefineOptions);

export const updateInternalMeetingSchema = createInternalMeetingFields
  .omit({ clinicId: true })
  .partial()
  .refine(timeRefineFn, timeRefineOptions);

export const updateParticipantStatusSchema = z.object({
  status: meetingStatusSchema,
});

export type InternalMeeting = z.infer<typeof internalMeetingSchema>;
export type CreateInternalMeeting = z.infer<typeof createInternalMeetingSchema>;
export type UpdateInternalMeeting = z.infer<typeof updateInternalMeetingSchema>;
