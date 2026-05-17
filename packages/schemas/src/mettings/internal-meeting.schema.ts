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

const createInternalMeetingBaseFields = internalMeetingSchema.pick({
  description: true,
  title: true,
  clinicId: true,
  participantIds: true,
});

export const createInternalMeetingSchema = createMeetingBaseSchema
  .omit({ kind: true, type: true })
  .extend(createInternalMeetingBaseFields.shape);

export const updateInternalMeetingSchema = createInternalMeetingSchema
  .omit({ clinicId: true })
  .partial();

export const updateParticipantStatusSchema = z.object({
  status: meetingStatusSchema,
});

export type InternalMeeting = z.infer<typeof internalMeetingSchema>;
export type CreateInternalMeeting = z.infer<typeof createInternalMeetingSchema>;
export type UpdateInternalMeeting = z.infer<typeof updateInternalMeetingSchema>;
