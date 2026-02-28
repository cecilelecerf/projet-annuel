import { z } from "zod";
import {
  clinicIdSchema,
  veterinarianIdSchema,
  veterinarianClinicIdSchema,
  availabilityIdSchema,
  specialityIdSchema,
} from "./ids";

// ── Clinic ────────────────────────────────────────────────────────────────────
export const clinicSchema = z.object({
  id: clinicIdSchema,
  adress: z.string().min(1),
  description: z.string().max(255).nullable().optional(),
  websiteUrl: z.string().url().max(255),
  picture: z.string().url().nullable().optional(),
});

export const createClinicSchema = clinicSchema.omit({ id: true });
export const updateClinicSchema = createClinicSchema.partial();

export type Clinic = z.infer<typeof clinicSchema>;
export type CreateClinic = z.infer<typeof createClinicSchema>;
export type UpdateClinic = z.infer<typeof updateClinicSchema>;

// ── VeterinarianClinic (junction) ─────────────────────────────────────────────
export const veterinarianClinicSchema = z.object({
  id: veterinarianClinicIdSchema,
  veterinarianId: veterinarianIdSchema,
  clinicId: clinicIdSchema,
});

export const createVeterinarianClinicSchema = veterinarianClinicSchema.omit({
  id: true,
});

export type VeterinarianClinic = z.infer<typeof veterinarianClinicSchema>;
export type CreateVeterinarianClinic = z.infer<
  typeof createVeterinarianClinicSchema
>;

// ── VeterinarianClinicAvailability ────────────────────────────────────────────
export const availabilityTypeSchema = z.enum([
  "recurring",
  "specified",
  "exception",
]);

export const veterinarianClinicAvailabilitySchema = z.object({
  id: availabilityIdSchema,
  vetoClinic: veterinarianClinicIdSchema,
  type: availabilityTypeSchema,
  dayOfWeek: z.number().int().min(0).max(6).nullable().optional(), // 0=lundi … 6=dimanche
  specificDate: z.string().date().nullable().optional(),
  startTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/), // HH:mm ou HH:mm:ss
  endTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
  isActive: z.boolean(),
});
// .refine(
//   (data) => {
//     if (data.type === 'recurring' && data.dayOfWeek === undefined) return false
//     if (data.type === 'specified' && !data.specificDate) return false
//     return true
//   },
//   { message: "dayOfWeek requis pour 'recurring', specificDate requis pour 'specified'" }
// )

export const createAvailabilitySchema =
  veterinarianClinicAvailabilitySchema.omit({ id: true });
export const updateAvailabilitySchema = createAvailabilitySchema.partial();

export type VeterinarianClinicAvailability = z.infer<
  typeof veterinarianClinicAvailabilitySchema
>;
export type CreateVeterinarianClinicAvailability = z.infer<
  typeof createAvailabilitySchema
>;
export type UpdateVeterinarianClinicAvailability = z.infer<
  typeof updateAvailabilitySchema
>;

// ── Speciality ────────────────────────────────────────────────────────────────
export const specialitySchema = z.object({
  id: specialityIdSchema,
  name: z.string().min(1).max(255),
  description: z.string().min(1).max(255),
});

export const createSpecialitySchema = specialitySchema.omit({ id: true });
export const updateSpecialitySchema = createSpecialitySchema.partial();

export type Speciality = z.infer<typeof specialitySchema>;
export type CreateSpeciality = z.infer<typeof createSpecialitySchema>;
export type UpdateSpeciality = z.infer<typeof updateSpecialitySchema>;
