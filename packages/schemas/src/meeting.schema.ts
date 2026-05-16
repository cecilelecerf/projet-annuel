import { z } from "zod";
import {
  meetingIdSchema,
  ownedPetIdSchema,
  veterinarianIdSchema,
  specialityIdSchema,
  clinicIdSchema,
  userIdSchema,
  veterinarianClinicIdSchema,
  internalMeetingParticipantIdSchema,
} from "./ids";

// ── Enums ─────────────────────────────────────────────────────────────────────
export const scheduleTypeSchema = z.enum([
  "RECURRING",
  "SPECIFIED",
  "EXCEPTION",
]);
export const meetingKindSchema = z.enum(["AVAILABILITY", "INTERNAL", "ANIMAL"]);
export const meetingStatusSchema = z.enum(["PENDING", "ACCEPTED", "DECLINED"]);

// ── InternalMeetingParticipant ────────────────────────────────────────────────
export const internalMeetingParticipantSchema = z.object({
  id: internalMeetingParticipantIdSchema,
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  meetingId: meetingIdSchema,
  userId: userIdSchema,
  status: meetingStatusSchema,
});

// ── MeetingBase ───────────────────────────────────────────────────────────────
export const meetingBaseSchema = z.object({
  id: meetingIdSchema,
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  type: scheduleTypeSchema,
  kind: meetingKindSchema,

  // RECURRING
  dayOfWeek: z.number().int().min(0).max(6).nullable().optional(),
  dateStart: z.coerce.date().nullable().optional(),
  dateEnd: z.coerce.date().nullable().optional(),

  // RECURRING + SPECIFIED
  startTime: z.coerce.date().nullable().optional(),
  endTime: z.coerce.date().nullable().optional(),

  // SPECIFIED + EXCEPTION
  specificDate: z.coerce.date().nullable().optional(),

  // EXCEPTION
  parentId: meetingIdSchema.nullable().optional(),
});

export const availabilityContextTypeSchema = z.enum([
  "VETERINARIAN_CLINIC",
  "USER",
]);
// ── VeterinarianClinicAvailability ────────────────────────────────────────────
export const veterinarianClinicAvailabilitySchema = meetingBaseSchema.extend({
  veterinarianClinicId: veterinarianClinicIdSchema,
  kind: z.literal("AVAILABILITY"),
  contextType: z.literal("VETERINARIAN_CLINIC"),
});

export const userAvailabilitySchema = meetingBaseSchema.extend({
  kind: z.literal("AVAILABILITY"),
  userId: userIdSchema,
  contextType: z.literal("USER"),
});
export const availabilitiesSchema = z.discriminatedUnion("contextType", [
  veterinarianClinicAvailabilitySchema,
  userAvailabilitySchema,
]);

// ── InternalMeeting ───────────────────────────────────────────────────────────
export const internalMeetingSchema = meetingBaseSchema.extend({
  title: z.string().max(255),
  description: z.string().nullable().optional(),
  clinicId: clinicIdSchema,
  participants: z.array(internalMeetingParticipantSchema).optional(),
  kind: z.literal("INTERNAL"),
});

// ── AnimalMeeting ─────────────────────────────────────────────────────────────
export const animalMeetingSchema = meetingBaseSchema.extend({
  description: z.string().nullable().optional(),
  petWeight: z.coerce.number().multipleOf(0.01).nullable().optional(),
  petSize: z.coerce.number().multipleOf(0.01).nullable().optional(),
  report: z.string().nullable().optional(),
  specialityId: specialityIdSchema.nullable().optional(),
  ownedPetId: ownedPetIdSchema,
  veterinarianId: veterinarianIdSchema,
  kind: z.literal("ANIMAL"),
});

export const meetingSchema = z.discriminatedUnion("kind", [
  availabilitiesSchema,
  internalMeetingSchema,
  animalMeetingSchema,
]);
// ── CRUD schemas ──────────────────────────────────────────────────────────────
export const createMeetingBaseSchema = meetingBaseSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const updateMeetingBaseSchema = createMeetingBaseSchema.partial();

export const meetingWithExceptionSchema = z
  .object({
    exceptions: z.array(meetingBaseSchema),
  })
  .and(meetingSchema);

export const calendarSchema = z.object({
  meetings: z.array(meetingWithExceptionSchema),
  availabilities: z.array(meetingWithExceptionSchema),
});

// ── Create schemas ────────────────────────────────────────────────────────────

export const createAvailabilitySchema = z.discriminatedUnion("contextType", [
  createMeetingBaseSchema.extend({
    kind: z.literal("AVAILABILITY"),
    contextType: z.literal("USER"),
    userId: userIdSchema,
  }),
  createMeetingBaseSchema.extend({
    kind: z.literal("AVAILABILITY"),
    contextType: z.literal("VETERINARIAN_CLINIC"),
    veterinarianClinicId: veterinarianClinicIdSchema,
  }),
]);

export const createInternalMeetingSchema = createMeetingBaseSchema.extend({
  kind: z.literal("INTERNAL"),
  title: z.string().min(1).max(255),
  description: z.string().nullable().optional(),
  clinicId: clinicIdSchema,
  participantIds: z.array(userIdSchema).min(1),
});

export const createAnimalMeetingSchema = createMeetingBaseSchema.extend({
  kind: z.literal("ANIMAL"),
  description: z.string().nullable().optional(),
  specialityId: specialityIdSchema.nullable().optional(),
  ownedPetId: ownedPetIdSchema,
  veterinarianId: veterinarianIdSchema,
});

export const updateInternalMeetingSchema = createInternalMeetingSchema
  .omit({ kind: true, clinicId: true })
  .partial();

export const updateAnimalMeetingSchema = createAnimalMeetingSchema
  .omit({ kind: true, ownedPetId: true, veterinarianId: true })
  .partial()
  .extend({
    petWeight: z.coerce.number().multipleOf(0.01).nullable().optional(),
    petSize: z.coerce.number().multipleOf(0.01).nullable().optional(),
    report: z.string().nullable().optional(),
  });

export const updateParticipantStatusSchema = z.object({
  status: meetingStatusSchema,
});

export const updateAvailabilitySchema = createMeetingBaseSchema.partial();

// ── Types ─────────────────────────────────────────────────────────────────────
export type CreateAvailability = z.infer<typeof createAvailabilitySchema>;
export type CreateInternalMeeting = z.infer<typeof createInternalMeetingSchema>;
export type CreateAnimalMeeting = z.infer<typeof createAnimalMeetingSchema>;
export type UpdateInternalMeeting = z.infer<typeof updateInternalMeetingSchema>;
export type UpdateAnimalMeeting = z.infer<typeof updateAnimalMeetingSchema>;
export type UpdateAvailability = z.infer<typeof updateAvailabilitySchema>;

export type Calendar = z.infer<typeof calendarSchema>;
export type MeetingWithException = z.infer<typeof meetingWithExceptionSchema>;
export type ScheduleType = z.infer<typeof scheduleTypeSchema>;
export type MeetingKind = z.infer<typeof meetingKindSchema>;
export type MeetingStatus = z.infer<typeof meetingStatusSchema>;
export type MeetingBase = z.infer<typeof meetingBaseSchema>;
export type Meeting = z.infer<typeof meetingSchema>;
export type InternalMeeting = z.infer<typeof internalMeetingSchema>;
export type AnimalMeeting = z.infer<typeof animalMeetingSchema>;
export type CreateMeetingBase = z.infer<typeof createMeetingBaseSchema>;
export type UpdateMeetingBase = z.infer<typeof updateMeetingBaseSchema>;
