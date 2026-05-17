import { z } from "zod";
import { meetingBaseSchema, meetingStatusSchema } from "./meeting-base.schema";
import { internalMeetingSchema } from "./internal-meeting.schema";
import { availabilitiesSchema } from "./availability.schema";
import { animalMeetingSchema } from "./animal-meeting.schema";

export const flatInternalMeetingSchema = internalMeetingSchema.extend({
  status: meetingStatusSchema.optional(),
});

export const flatMeetingSchema = z.discriminatedUnion("kind", [
  availabilitiesSchema,
  flatInternalMeetingSchema,
  animalMeetingSchema,
]);

export const meetingWithExceptionSchema = flatMeetingSchema;

export const calendarSchema = z.object({
  meetings: z.array(meetingWithExceptionSchema),
  availabilities: z.array(meetingWithExceptionSchema),
});

// ── Types ─────────────────────────────────────────────────────────────────────
export type FlatInternalMeeting = z.infer<typeof flatInternalMeetingSchema>;
export type FlatMeeting = z.infer<typeof flatMeetingSchema>;
export type Calendar = z.infer<typeof calendarSchema>;
export type MeetingWithException = z.infer<typeof meetingWithExceptionSchema>;
