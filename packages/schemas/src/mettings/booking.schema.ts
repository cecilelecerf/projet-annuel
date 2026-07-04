import { z } from "zod";
import { animalWithRaceMetaSchema } from "../animals/meta.schema";
import { clinicSchema, specialitySchema } from "../clinic.schema";
import { veterinarianProfileSchema } from "../users/veterinarian.schema";
import { baseUserSchema } from "../users/base-user.schema";
import { animalIdSchema, specialityIdSchema, meetingIdSchema } from "../ids";

// ── Animal pour le booking ────────────────────────────────────────────────────
// Réutilise animalWithRaceMetaSchema, on pick uniquement ce dont l'UI a besoin
export const bookingAnimalSchema = animalWithRaceMetaSchema.pick({
  id: true,
  name: true,
  race: true,
  dateOfBirth: true,
});

export type BookingAnimal = z.infer<typeof bookingAnimalSchema>;

// ── Spécialité pour le booking ────────────────────────────────────────────────
// Réutilise specialitySchema tel quel — id + name + description
export const bookingSpecialitySchema = specialitySchema.pick({
  id: true,
  name: true,
});

export type BookingSpeciality = z.infer<typeof bookingSpecialitySchema>;

// ── Filtres de recherche ──────────────────────────────────────────────────────
export const bookingFiltersSchema = z.object({
  lat: z.number().nullable(),
  lng: z.number().nullable(),
  address: z.string(),
  radiusKm: z.number().int().min(1).max(200).default(20),
  date: z.string().optional(), // YYYY-MM-DD
  specialityId: specialityIdSchema.nullable().optional(),
  petId: z.string().nullable().optional(),
});

export type BookingFilters = z.infer<typeof bookingFiltersSchema>;

// ── Clinique dans les résultats ───────────────────────────────────────────────
// Réutilise clinicSchema.pick + étend avec les champs propres au booking
export const bookingClinicSchema = clinicSchema
  .pick({
    id: true,
    name: true,
    address: true,
    phone: true,
    description: true,
    openingHours: true,
  })
  .extend({
    lat: z.number(),
    lng: z.number(),
    distanceKm: z.number(),
    rating: z.number().min(0).max(5).nullable().optional(),
    vetCount: z.number().int().nonnegative(),
    specialities: z.array(z.string()),
    nextSlot: z.string().nullable(),
  });

export type BookingClinic = z.infer<typeof bookingClinicSchema>;

// ── Vétérinaire dans le contexte booking ─────────────────────────────────────
// Réutilise veterinarianProfileSchema.pick + user depuis baseUserSchema
export const bookingVetSchema = veterinarianProfileSchema
  .pick({ id: true, bio: true })
  .extend({
    user: baseUserSchema.pick({
      firstname: true,
      lastname: true,
      picture: true,
    }),
    specialities: z.array(bookingSpecialitySchema),
    rating: z.number().min(0).max(5).nullable().optional(),
  });

export type BookingVet = z.infer<typeof bookingVetSchema>;

// ── Créneau disponible ────────────────────────────────────────────────────────
export const bookingSlotSchema = z.object({
  date: z.coerce.date(),
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
});

export type BookingSlot = z.infer<typeof bookingSlotSchema>;

// ── Payload de création ───────────────────────────────────────────────────────
export const createBookingSchema = z.object({
  animalId: animalIdSchema,
  veterinarianId: veterinarianProfileSchema.shape.id,
  date: z.coerce.date(),
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
  specialityId: specialityIdSchema.nullable().optional(),
  description: z.string().max(500).nullable().optional(),
});

export type CreateBooking = z.infer<typeof createBookingSchema>;

// ── Confirmation après création ───────────────────────────────────────────────
export const bookingConfirmationSchema = z.object({
  meetingId: meetingIdSchema,
  clinic: clinicSchema.pick({ id: true, name: true, address: true }),
  vet: bookingVetSchema.pick({ id: true, user: true }),
  animal: bookingAnimalSchema.pick({ id: true, name: true }),
  slot: bookingSlotSchema,
});

export type BookingConfirmation = z.infer<typeof bookingConfirmationSchema>;

// ── Query params pour la recherche (backend) ──────────────────────────────────
export const bookingSearchQuerySchema = z.object({
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
  address: z.string().optional(),
  radiusKm: z.coerce.number().default(20),
  date: z.string().optional(),
  specialityId: specialityIdSchema.optional(),
  petId: z.string().optional(),
});

export type BookingSearchQuery = z.infer<typeof bookingSearchQuerySchema>;
