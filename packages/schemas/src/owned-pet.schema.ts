import z from "zod";
import {
  clientIdSchema,
  meetingIdSchema,
  ownedPetIdSchema,
  petVaccineIdSchema,
  raceIdSchema,
  vaccineIdSchema,
  veterinarianIdSchema,
} from "./ids";
import { userSchema } from "./users";
import { raceMetaSchema } from "./pet.schema";

// ── OwnedPet (animal d'un client) ─────────────────────────────────────────────
export const ownedPetSchema = z.object({
  id: ownedPetIdSchema,
  clientId: clientIdSchema,
  raceId: raceIdSchema,
  name: z.string().min(1).max(30),
  dateOfBirth: z.coerce.date(),
  description: z.string().max(255).nullable().optional(),
  attendingVeterinarianId: veterinarianIdSchema.nullable().optional(),
  activity: z.number().int().min(1).max(10).nullable().optional(),
  //   picture: z.url().max(255).nullable().optional(),
});

export const ownedPetWithUserSchema = ownedPetSchema.extend({
  client: userSchema,
});
export const ownedPetMetaSchema = ownedPetSchema.extend({
  client: userSchema,
  age: z.object({
    years: z.number().nonnegative(),
    months: z.number().nonnegative(),
  }),
  race: raceMetaSchema,
});

export const createOwnedPetSchema = ownedPetSchema.omit({
  id: true,
  clientId: true,
});
export const updateOwnedPetSchema = createOwnedPetSchema.partial();

export type OwnedPetWithUser = z.infer<typeof ownedPetWithUserSchema>;
export type OwnedPet = z.infer<typeof ownedPetSchema>;
export type CreateOwnedPet = z.infer<typeof createOwnedPetSchema>;
export type UpdateOwnedPet = z.infer<typeof updateOwnedPetSchema>;

// ── PetVaccine (vaccination réalisée) ─────────────────────────────────────────
export const petVaccineSchema = z.object({
  id: petVaccineIdSchema,
  petId: ownedPetIdSchema,
  date: z.coerce.date(),
  vaccineId: vaccineIdSchema,
  meetingId: meetingIdSchema.nullable().optional(),
});

export const createPetVaccineSchema = petVaccineSchema.omit({ id: true });

export type PetVaccine = z.infer<typeof petVaccineSchema>;
export type CreatePetVaccine = z.infer<typeof createPetVaccineSchema>;
