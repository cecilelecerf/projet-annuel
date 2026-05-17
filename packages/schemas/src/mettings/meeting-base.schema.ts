import { z } from "zod";
import { meetingIdSchema, meetingRecurringIdSchema } from "../ids";

export const scheduleTypeSchema = z.enum([
  "RECURRING",
  "SPECIFIED",
  "EXCEPTION",
]);
export const meetingKindSchema = z.enum(["AVAILABILITY", "INTERNAL", "ANIMAL"]);
export const meetingStatusSchema = z.enum(["PENDING", "ACCEPTED", "DECLINED"]);

export const meetingBaseSchema = z.object({
  id: meetingIdSchema,
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  type: scheduleTypeSchema,
  kind: meetingKindSchema,
  date: z.coerce.date(),
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
  parentId: meetingRecurringIdSchema.nullable().optional(),
});

export const meetingRecurringSchema = z.object({
  id: meetingRecurringIdSchema,
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),

  dateStart: z.coerce.date(),
  dateEnd: z.coerce.date(),

  dayOfWeek: z.number().int().array(),
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),

  childrens: meetingBaseSchema.array(),

  kind: meetingKindSchema,
});
export const createMeetingBaseSchema = meetingBaseSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateMeetingBaseSchema = createMeetingBaseSchema.partial();

export type ScheduleType = z.infer<typeof scheduleTypeSchema>;
export type MeetingKind = z.infer<typeof meetingKindSchema>;
export type MeetingStatus = z.infer<typeof meetingStatusSchema>;
export type MeetingBase = z.infer<typeof meetingBaseSchema>;
export type CreateMeetingBase = z.infer<typeof createMeetingBaseSchema>;
export type UpdateMeetingBase = z.infer<typeof updateMeetingBaseSchema>;
