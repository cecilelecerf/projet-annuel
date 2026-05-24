import z from "zod";
import {
  clientIdSchema,
  meetingIdSchema,
  animalIdSchema,
  petVaccineIdSchema,
  raceIdSchema,
  vaccineIdSchema,
  veterinarianIdSchema,
} from "../ids";
import { veterinarianProfileSchema } from "../users";
// ── Animal (animal d'un client) ─────────────────────────────────────────────
export const animalSchema = z.object({
  id: animalIdSchema,
  clientId: clientIdSchema,
  raceId: raceIdSchema,
  name: z.string().min(1).max(30),
  dateOfBirth: z.coerce.date(),
  description: z.string().max(255).nullable().optional(),
  attendingVeterinarianId: veterinarianIdSchema.nullable().optional(),
  activity: z.number().int().min(1).max(10).nullable().optional(),
  //   picture: z.url().max(255).nullable().optional(),
});

export const createAnimalSchema = animalSchema.omit({
  id: true,
  clientId: true,
});
export const updateAnimalSchema = createAnimalSchema.partial();

export type Animal = z.infer<typeof animalSchema>;
export type CreateAnimal = z.infer<typeof createAnimalSchema>;
export type UpdateAnimal = z.infer<typeof updateAnimalSchema>;
