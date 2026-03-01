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
export const mettingKindSchema = z.enum(["AVAILABILITY", "INTERNAL", "ANIMAL"]);
export const meetingStatusSchema = z.enum(["PENDING", "ACCEPTED", "DECLINED"]);

// ── InternalMettingParticipant ────────────────────────────────────────────────
export const internalMettingParticipantSchema = z.object({
  id: internalMeetingParticipantIdSchema,
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  mettingId: meetingIdSchema,
  userId: userIdSchema,
  status: meetingStatusSchema,
});

// ── MettingBase ───────────────────────────────────────────────────────────────
export const mettingBaseSchema = z.object({
  id: meetingIdSchema,
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  type: scheduleTypeSchema,
  kind: mettingKindSchema,

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

// ── VeterinarianClinicAvailability ────────────────────────────────────────────
export const veterinarianClinicAvailabilitySchema = mettingBaseSchema.extend({
  veterinarianClinicId: veterinarianClinicIdSchema,
  kind: z.literal("AVAILABILITY"),
});

// ── InternalMetting ───────────────────────────────────────────────────────────
export const internalMettingSchema = mettingBaseSchema.extend({
  title: z.string().max(255),
  description: z.string().nullable().optional(),
  clinicId: clinicIdSchema,
  participants: z.array(internalMettingParticipantSchema).optional(),
  kind: z.literal("INTERNAL"),
});

// ── AnimalMetting ─────────────────────────────────────────────────────────────
export const animalMettingSchema = mettingBaseSchema.extend({
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
  veterinarianClinicAvailabilitySchema,
  internalMettingSchema,
  animalMettingSchema,
]);
// ── CRUD schemas ──────────────────────────────────────────────────────────────
export const createMettingBaseSchema = mettingBaseSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const updateMettingBaseSchema = createMettingBaseSchema.partial();

export const mettingWithExceptionSchema = z
  .object({
    exceptions: z.array(mettingBaseSchema),
  })
  .and(meetingSchema);

export type MettingWithException = z.infer<typeof mettingWithExceptionSchema>;
export type ScheduleType = z.infer<typeof scheduleTypeSchema>;
export type MettingKind = z.infer<typeof mettingKindSchema>;
export type MeetingStatus = z.infer<typeof meetingStatusSchema>;
export type MettingBase = z.infer<typeof mettingBaseSchema>;
export type Meeting = z.infer<typeof meetingSchema>;
export type InternalMetting = z.infer<typeof internalMettingSchema>;
export type AnimalMetting = z.infer<typeof animalMettingSchema>;
export type CreateMettingBase = z.infer<typeof createMettingBaseSchema>;
export type UpdateMettingBase = z.infer<typeof updateMettingBaseSchema>;
