import z from "zod";
import {
  baseUserSchema,
  clientProfileSchema,
  userSchema,
  veterinarianProfileSchema,
} from "../users";
import { healthConditionSchema, raceMetaSchema } from "../pet.schema";
import { clientPetHealthConditionSchema } from "../health.schema";
import { animalSchema } from "./index.schema";
import { animalVaccineSchema } from "../acts";

export const animalWithUserSchema = animalSchema.extend({
  client: userSchema,
});
export const animalMetaSchema = animalSchema.extend({
  client: userSchema,
  age: z.object({
    years: z.number().nonnegative(),
    months: z.number().nonnegative(),
  }),
  race: raceMetaSchema,
});

export const animalWithRaceMeta = animalSchema.extend({
  race: raceMetaSchema,
});
export type AnimalWithUser = z.infer<typeof animalWithUserSchema>;

export const animalDetailSchema = animalSchema.extend({
  animalConditionHealths: clientPetHealthConditionSchema
    .extend({ healthCondition: healthConditionSchema })
    .omit({ addedBy: true })
    .array(),
  client: clientProfileSchema.extend({ user: baseUserSchema }),
  race: raceMetaSchema,
  animalVaccine: animalVaccineSchema.array(),
  attendingVeterinarian: veterinarianProfileSchema
    .extend({ user: baseUserSchema })
    .nullable()
    .optional(),
});

export type AnimalDetail = z.infer<typeof animalDetailSchema>;
