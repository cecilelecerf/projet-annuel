import z from "zod";
import {
  clientIdSchema,
  animalIdSchema,
  raceIdSchema,
  veterinarianClinicIdSchema,
} from "../ids";
export const animalStatusSchema = z.enum(["ALIVE", "DECEASED"]);
export type AnimalStatus = z.infer<typeof animalStatusSchema>;

export const animalSchema = z.object({
  id: animalIdSchema,
  clientId: clientIdSchema,
  raceId: raceIdSchema,
  name: z.string().min(1).max(30),
  dateOfBirth: z.coerce.date(),
  description: z.string().max(255).nullable().optional(),
  attendingVeterinarianClinicId: veterinarianClinicIdSchema.nullable(),
  activity: z.number().int().min(1).max(10).nullable().optional(),
  outdoorAccess: z.boolean(),
  animalContact: z.boolean(),
  status: animalStatusSchema,
  hasInsurance: z.boolean(),
  insuranceProvider: z.string().max(100).nullable().optional(),
  insurancePolicyNumber: z.string().max(100).nullable().optional(),
  //   picture: z.url().max(255).nullable().optional(),
});

export const createAnimalSchema = animalSchema
  .omit({
    id: true,
    clientId: true,
    attendingVeterinarianClinicId: true,
    status: true,
  })
  .extend({ clientId: clientIdSchema.optional() });
export const updateAnimalSchema = createAnimalSchema
  .extend({
    attendingVeterinarianClinicId: veterinarianClinicIdSchema.optional(),
  })
  .partial();

export type Animal = z.infer<typeof animalSchema>;
export type CreateAnimal = z.infer<typeof createAnimalSchema>;
export type UpdateAnimal = z.infer<typeof updateAnimalSchema>;

export const animalDeletionReasonSchema = z.enum([
  "DECEASED",
  "NO_LONGER_NEEDS_FOLLOWUP",
  "OTHER",
]);
export type AnimalDeletionReason = z.infer<typeof animalDeletionReasonSchema>;

export const deleteAnimalSchema = z.object({
  reasons: z.array(animalDeletionReasonSchema).min(1, "Sélectionnez au moins une raison"),
  comment: z.string().max(500).optional(),
});
export type DeleteAnimal = z.infer<typeof deleteAnimalSchema>;
