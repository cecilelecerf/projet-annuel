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
  meetingParticipantStatusSchema,
} from "./meeting-base.schema";
import { timeRefineFn, timeRefineOptions } from "./utils";
import { userSchema } from "../users";

export const internalMeetingParticipantSchema = z.object({
  id: internalMeetingParticipantIdSchema,
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  meetingId: meetingIdSchema,
  userId: userIdSchema,
  status: meetingParticipantStatusSchema,
});
export const internalMeetingParticipantMetaSchema = z.object({
  id: internalMeetingParticipantIdSchema,
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  meetingId: meetingIdSchema,
  userId: userIdSchema,
  user: userSchema,
  status: meetingParticipantStatusSchema,
});
export const internalMeetingField = z.object({
  title: z.string().max(255),
  description: z.string().nullable().optional(),
  clinicId: clinicIdSchema,
  participants: internalMeetingParticipantSchema.array(),
});
export const internalMeetingSchema = meetingBaseSchema.extend({
  ...internalMeetingField.shape,
  kind: z.literal("INTERNAL"),
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

export const createInternalMeetingFields = createMeetingBaseSchema
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
  status: meetingParticipantStatusSchema,
  date: z.coerce.date().optional(),
  scope: z.enum(["single", "all"]),
});
export type UpdateParticipantStatus = z.infer<
  typeof updateParticipantStatusSchema
>;
export type InternalMeetingMeta = z.infer<typeof internalMeetingMetaSchema>;
export type InternalMeeting = z.infer<typeof internalMeetingSchema>;
export type CreateInternalMeeting = z.infer<typeof createInternalMeetingSchema>;
export type UpdateInternalMeeting = z.infer<typeof updateInternalMeetingSchema>;
