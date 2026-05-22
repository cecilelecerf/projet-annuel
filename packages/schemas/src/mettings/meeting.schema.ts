import { z } from "zod";
import { availabilitiesSchema } from "./availability.schema";
import {
  internalMeetingMetaSchema,
  internalMeetingSchema,
} from "./internal-meeting.schema";
import {
  animalMeetingMetaSchema,
  animalMeetingSchema,
} from "./animal-meeting.schema";

export const meetingSchema = z.discriminatedUnion("kind", [
  availabilitiesSchema,
  internalMeetingSchema,
  animalMeetingSchema,
]);
export const meetingMetaSchema = z.discriminatedUnion("kind", [
  availabilitiesSchema,
  internalMeetingMetaSchema,
  animalMeetingMetaSchema,
]);
export type Meeting = z.infer<typeof meetingSchema>;
export type MeetingMeta = z.infer<typeof meetingMetaSchema>;
