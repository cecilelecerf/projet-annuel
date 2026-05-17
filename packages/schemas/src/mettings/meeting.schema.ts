import { z } from "zod";
import { availabilitiesSchema } from "./availability.schema";
import { internalMeetingSchema } from "./internal-meeting.schema";
import { animalMeetingSchema } from "./animal-meeting.schema";

export const meetingSchema = z.discriminatedUnion("kind", [
  availabilitiesSchema,
  internalMeetingSchema,
  animalMeetingSchema,
]);

export type Meeting = z.infer<typeof meetingSchema>;
