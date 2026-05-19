import { z } from "zod";
import {
  petIdSchema,
  ownedPetIdSchema,
  raceIdSchema,
  clientIdSchema,
  veterinarianIdSchema,
  clinicIdSchema,
  meetingIdSchema,
  vaccineIdSchema,
  petVaccineIdSchema,
  clinicPetIdSchema,
  veterinarianPetIdSchema,
  healthConditionIdSchema,
} from "./ids";

// ── Pet (espèce/type générique) ───────────────────────────────────────────────
export const petSchema = z.object({
  id: petIdSchema,
  picture: z.string().url().nullable().optional(),
  name: z.string().min(1),
});

export const createPetSchema = petSchema.omit({ id: true });
export const updatePetSchema = createPetSchema.partial();

export type Pet = z.infer<typeof petSchema>;
export type CreatePet = z.infer<typeof createPetSchema>;
export type UpdatePet = z.infer<typeof updatePetSchema>;

// ── Race ──────────────────────────────────────────────────────────────────────
export const raceSchema = z.object({
  id: raceIdSchema,
  petId: petIdSchema,
  name: z.string().min(1),
  picture: z.string().url().nullable().optional(),
});

export const createRaceSchema = raceSchema.omit({ id: true });
export const updateRaceSchema = createRaceSchema.partial();

export type Race = z.infer<typeof raceSchema>;
export type CreateRace = z.infer<typeof createRaceSchema>;
export type UpdateRace = z.infer<typeof updateRaceSchema>;

// ── Vaccine ───────────────────────────────────────────────────────────────────
export const vaccineSchema = z.object({
  id: vaccineIdSchema,
  name: z.string().min(1),
  description: z.string().max(255).nullable().optional(),
  petId: petIdSchema,
  recommendedAge: z.number().int().positive(), // en semaine
  boosterInterval: z.number().int().positive(), // en semaine
  mandatoryCountry: z.array(z.string()).nullable().optional(),
  recommendedCountry: z.array(z.string()).nullable().optional(),
});

export const createVaccineSchema = vaccineSchema.omit({ id: true });
export const updateVaccineSchema = createVaccineSchema.partial();

export type Vaccine = z.infer<typeof vaccineSchema>;
export type CreateVaccine = z.infer<typeof createVaccineSchema>;
export type UpdateVaccine = z.infer<typeof updateVaccineSchema>;

// ── ClinicPet (junction clinique ↔ espèce) ────────────────────────────────────
export const clinicPetSchema = z.object({
  id: clinicPetIdSchema,
  petId: petIdSchema,
  clinicId: clinicIdSchema,
});

export const createClinicPetSchema = clinicPetSchema.omit({ id: true });

export type ClinicPet = z.infer<typeof clinicPetSchema>;
export type CreateClinicPet = z.infer<typeof createClinicPetSchema>;

// ── VeterinarianPet (junction vétérinaire ↔ espèce) ──────────────────────────
export const veterinarianPetSchema = z.object({
  id: veterinarianPetIdSchema,
  veterinarianId: veterinarianIdSchema,
  petId: petIdSchema,
});

export const createVeterinarianPetSchema = veterinarianPetSchema.omit({
  id: true,
});

export type VeterinarianPet = z.infer<typeof veterinarianPetSchema>;
export type CreateVeterinarianPet = z.infer<typeof createVeterinarianPetSchema>;

// ── HealthCondition ───────────────────────────────────────────────────────────
export const healthConditionSchema = z.object({
  id: healthConditionIdSchema,
  name: z.string().min(1).max(255),
  description: z.string().min(1).max(255),
  petId: petIdSchema.nullable().optional(),
});

export const createHealthConditionSchema = healthConditionSchema.omit({
  id: true,
});
export const updateHealthConditionSchema =
  createHealthConditionSchema.partial();

export type HealthCondition = z.infer<typeof healthConditionSchema>;
export type CreateHealthCondition = z.infer<typeof createHealthConditionSchema>;
export type UpdateHealthCondition = z.infer<typeof updateHealthConditionSchema>;
