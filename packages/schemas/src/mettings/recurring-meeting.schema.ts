import z from "zod";
import { meetingRecurringIdSchema } from "../ids";
import { meetingKindSchema } from "./meeting-base.schema";
export const meetingFrequencySchema = z.enum([
  "DAILY",
  "WEEKLY",
  "MONTHLY",
  "YEARLY",
]);

export const meetingRecurringSchema = z.object({
  id: meetingRecurringIdSchema,
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),

  dateStart: z.coerce.date(),
  dateEnd: z.coerce.date(),
  frequency: meetingFrequencySchema,

  dayOfWeek: z.number().int().array(),
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),

  kind: meetingKindSchema,
});

export const updateRecurringSchema = z.object({
  dayOfWeek: z.array(z.number().int().min(0).max(6)).optional(),
  startTime: z.coerce.date().optional(),
  endTime: z.coerce.date().optional(),
  dateStart: z.coerce.date().optional(),
  dateEnd: z.coerce.date().optional(),
  frequency: meetingFrequencySchema.optional(),
});

export type UpdateRecurring = z.infer<typeof updateRecurringSchema>;
export type MeetingFrequency = z.infer<typeof meetingFrequencySchema>;

export type MeetingRecurring = z.infer<typeof meetingRecurringSchema>;
