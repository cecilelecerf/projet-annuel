import { z } from "zod";
import {
  meetingIdSchema,
  ownedPetIdSchema,
  veterinarianClinicIdSchema,
  specialityIdSchema,
} from "./ids";

// ── Meeting ───────────────────────────────────────────────────────────────────
export const meetingStatusSchema = z.enum([
  "pending",
  "confirmed",
  "done",
  "cancelled",
]);

export const meetingSchema = z.object({
  id: meetingIdSchema,
  createdAt: z.string().datetime(),
  modifiedAt: z.string().datetime(),
  petId: ownedPetIdSchema,
  vetoClinicId: veterinarianClinicIdSchema,
  startDatetime: z.string().datetime(),
  endDatetime: z.string().datetime(),
  description: z.string().max(255).nullable().optional(),
  weight: z.number().multipleOf(0.01).nullable().optional(), // DECIMAL(5,2)
  size: z.number().multipleOf(0.01).nullable().optional(), // DECIMAL(5,2)
  status: meetingStatusSchema,
  report: z.string().nullable().optional(),
  specialityId: specialityIdSchema.nullable().optional(),
});
// .refine(
//   (data) => new Date(data.endDatetime) > new Date(data.startDatetime),
//   {
//     message: "endDatetime doit être après startDatetime",
//     path: ["endDatetime"],
//   },
// );

export const createMeetingSchema = meetingSchema.omit({
  id: true,
  createdAt: true,
  modifiedAt: true,
});
export const updateMeetingSchema = createMeetingSchema.partial();

export type MeetingStatus = z.infer<typeof meetingStatusSchema>;
export type Meeting = z.infer<typeof meetingSchema>;
export type CreateMeeting = z.infer<typeof createMeetingSchema>;
export type UpdateMeeting = z.infer<typeof updateMeetingSchema>;
