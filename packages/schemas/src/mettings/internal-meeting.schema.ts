import { z } from "zod";
import {
  clinicIdSchema,
  internalMeetingParticipantIdSchema,
  meetingIdSchema,
  meetingRecurringIdSchema,
  userIdSchema,
} from "../ids";
import {
  createMeetingBaseSchema,
  meetingBaseSchema,
  meetingStatusSchema,
} from "./meeting-base.schema";
import { timeRefineFn, timeRefineOptions } from "./utils";
import { userSchema } from "../users";

export const internalMeetingParticipantSchema = z.object({
  id: internalMeetingParticipantIdSchema,
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  meetingId: meetingIdSchema,
  userId: userIdSchema,
  status: meetingStatusSchema,
});
export const internalMeetingParticipantMetaSchema = z.object({
  id: internalMeetingParticipantIdSchema,
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  meetingId: meetingIdSchema,
  userId: userIdSchema,
  user: userSchema,
  status: meetingStatusSchema,
});

export const internalMeetingSchema = meetingBaseSchema.extend({
  title: z.string().max(255),
  description: z.string().nullable().optional(),
  clinicId: clinicIdSchema,
  participants: internalMeetingParticipantSchema.array(),
  kind: z.literal("INTERNAL"),
  recurringId: meetingRecurringIdSchema.nullable(),
});
export const internalMeetingMetaSchema = internalMeetingSchema.extend({
  participants: z.array(internalMeetingParticipantMetaSchema),
});

const createInternalMeetingBaseFields = internalMeetingSchema
  .pick({
    description: true,
    title: true,
    clinicId: true,
  })
  .partial({ clinicId: true })
  .extend({ userIds: userIdSchema.array() });

const createInternalMeetingFields = createMeetingBaseSchema
  .omit({ kind: true, type: true, parentId: true })
  .extend(createInternalMeetingBaseFields.shape);

export const createInternalMeetingSchema = createInternalMeetingFields.refine(
  timeRefineFn,
  timeRefineOptions,
);

export const updateInternalMeetingSchema = createInternalMeetingFields
  .omit({ clinicId: true })
  .partial()
  .refine(timeRefineFn, timeRefineOptions);

export const updateParticipantStatusSchema = z.object({
  status: meetingStatusSchema,
});

export type InternalMeetingMeta = z.infer<typeof internalMeetingMetaSchema>;
export type InternalMeeting = z.infer<typeof internalMeetingSchema>;
export type CreateInternalMeeting = z.infer<typeof createInternalMeetingSchema>;
export type UpdateInternalMeeting = z.infer<typeof updateInternalMeetingSchema>;
