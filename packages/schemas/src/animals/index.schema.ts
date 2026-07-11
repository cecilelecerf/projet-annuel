import z from "zod";
import {
  clientIdSchema,
  animalIdSchema,
  raceIdSchema,
  veterinarianClinicIdSchema,
} from "../ids";
// ── Animal (animal d'un client) ─────────────────────────────────────────────
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
  //   picture: z.url().max(255).nullable().optional(),
});

export const createAnimalSchema = animalSchema
  .omit({
    id: true,
    clientId: true,
    attendingVeterinarianClinicId: true,
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
