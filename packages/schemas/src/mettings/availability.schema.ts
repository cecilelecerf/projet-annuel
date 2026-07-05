import { z } from "zod";
import {
  availabilityIdSchema,
  clinicIdSchema,
  meetingIdSchema,
  meetingRecurringIdSchema,
  userIdSchema,
} from "../ids";
import { meetingBaseSchema } from "./meeting-base.schema";
import {
  meetingFrequencySchema,
  meetingRecurringSchema,
  updateRecurringSchema,
} from "./recurring-meeting.schema";
import { clinicSchema } from "../clinic.schema";

export const availabilitySchema = z.object({
  id: availabilityIdSchema,
  recurringId: meetingRecurringIdSchema.nullable(),
  meetingId: meetingIdSchema.nullable(),
  userId: userIdSchema.nullable(),
  clinicId: clinicIdSchema,
  kind: z.literal("AVAILABILITY"),
});

export type Availability = z.infer<typeof availabilitySchema>;

export const availabilitiesSchema = meetingBaseSchema.extend({
  ...availabilitySchema.shape,
  clinic: clinicSchema,
});

// ── Requests ──────────────────────────────────────────────────────────────────

// Créer une dispo récurrente
export const createRecurringAvailabilitySchema = z
  .object({
    kind: z.literal("AVAILABILITY"),
    frequency: meetingFrequencySchema.default("WEEKLY"),
    dayOfWeek: z
      .array(z.number().int().min(0).max(6))
      .min(1, "Sélectionne au moins un jour"),
    startTime: z.coerce.date(),
    endTime: z.coerce.date(),
    dateStart: z.coerce.date(),
    dateEnd: z.coerce.date(),
    type: z.literal("RECURRING"),
  })
  .refine((d) => d.startTime < d.endTime, {
    message: "L'heure de fin doit être après l'heure de début",
    path: ["endTime"],
  })
  .refine((d) => d.dateStart < d.dateEnd, {
    message: "La date de fin doit être après la date de début",
    path: ["dateEnd"],
  });

export type CreateRecurringAvailability = z.infer<
  typeof createRecurringAvailabilitySchema
>;

// Créer une dispo ponctuelle (SPECIFIED)
export const createPunctualAvailabilitySchema = z
  .object({
    kind: z.literal("AVAILABILITY"),
    type: z.literal("SPECIFIED"),
    date: z.coerce.date(),
    startTime: z.coerce.date(),
    endTime: z.coerce.date(),
  })
  .refine((d) => d.startTime < d.endTime, {
    message: "L'heure de fin doit être après l'heure de début",
    path: ["endTime"],
  })
  .refine((d) => d.date >= new Date(new Date().toDateString()), {
    message: "La date doit être dans le futur",
    path: ["date"],
  });

export type CreatePunctualAvailability = z.infer<
  typeof createPunctualAvailabilitySchema
>;

// Créer une exception (EXCEPTION) — marque une journée comme indisponible
export const createAvailabilityExceptionSchema = z.object({
  type: z.literal("EXCEPTION"),
  date: z.coerce.date(),
  parentId: meetingRecurringIdSchema,
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
});

export type CreateAvailabilityException = z.infer<
  typeof createAvailabilityExceptionSchema
>;

// Union des trois cas pour le controller
export const createAvailabilitySchema = z.discriminatedUnion("type", [
  createPunctualAvailabilitySchema,
  createAvailabilityExceptionSchema,
  createRecurringAvailabilitySchema,
]);

export type CreateAvailability = z.infer<typeof createAvailabilitySchema>;

// Update récurrence
export const updateRecurringAvailabilitySchema = z
  .object({
    ...updateRecurringSchema.shape,
    recurringId: meetingRecurringIdSchema,
    type: z.literal("RECURRING"),
  })
  .refine(
    (d) => {
      if (d.startTime && d.endTime) return d.startTime < d.endTime;
      return true;
    },
    {
      message: "L'heure de fin doit être après l'heure de début",
      path: ["endTime"],
    },
  );

export type UpdateRecurringAvailability = z.infer<
  typeof updateRecurringAvailabilitySchema
>;

// Update ponctuelle
export const updatePunctualAvailabilitySchema = z
  .object({
    date: z.coerce.date().optional(),
    startTime: z.coerce.date().optional(),
    endTime: z.coerce.date().optional(),
    type: z.literal("PUNCTUAL"),
  })
  .refine(
    (d) => {
      if (d.startTime && d.endTime) return d.startTime < d.endTime;
      return true;
    },
    {
      message: "L'heure de fin doit être après l'heure de début",
      path: ["endTime"],
    },
  );
export type UpdatePunctualAvailability = z.infer<
  typeof updatePunctualAvailabilitySchema
>;

export const updateAvailabilitySchema = z.discriminatedUnion("type", [
  updatePunctualAvailabilitySchema,
  updateRecurringAvailabilitySchema,
]);

export type UpdateAvailability = z.infer<typeof updateAvailabilitySchema>;

// ── Responses ─────────────────────────────────────────────────────────────────

// Ce que l'API renvoie pour une dispo récurrente
export const availabilityRecurringResponseSchema = availabilitySchema
  .pick({ id: true, clinicId: true, userId: true })
  .extend({
    recurring: meetingRecurringSchema,
    recurringId: meetingRecurringIdSchema,
    clinic: clinicSchema,
    type: z.literal("RECURRING"),
  });

export type AvailabilityRecurringResponse = z.infer<
  typeof availabilityRecurringResponseSchema
>;

// Ce que l'API renvoie pour une dispo ponctuelle
export const availabilityPunctualResponseSchema = availabilitySchema
  .pick({
    id: true,
    clinicId: true,
    userId: true,
  })
  .extend({
    clinic: clinicSchema,
    meeting: meetingBaseSchema,
    type: z.literal("PUNCTUAL"),
  });

export type AvailabilityPunctualResponse = z.infer<
  typeof availabilityPunctualResponseSchema
>;

// Union des deux pour la liste
export const availabilityResponseSchema = z.discriminatedUnion("type", [
  availabilityRecurringResponseSchema,
  availabilityPunctualResponseSchema,
]);

export type AvailabilityResponse = z.infer<typeof availabilityResponseSchema>;

export const timeRangeSchema = z.object({
  start: z.coerce.date(),
  end: z.coerce.date(),
});

export const availabilityTimelineSchema = z.object({
  windows: timeRangeSchema.array(),
  busy: timeRangeSchema.array(),
});

export type TimeRange = z.infer<typeof timeRangeSchema>;
export type AvailabilityTimeline = z.infer<typeof availabilityTimelineSchema>;
