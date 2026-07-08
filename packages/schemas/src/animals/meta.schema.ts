import z from "zod";
import {
  baseUserSchema,
  clientProfileSchema,
  clientSchema,
  userSchema,
  veterinarianProfileSchema,
} from "../users";
import { raceMetaSchema } from "../pet.schema";
import { clientPetHealthConditionMetaSchema } from "../health.schema";
import { animalSchema } from "./index.schema";
import { animalVaccineSchema } from "../acts";
import { veterinarianClinicMetaSchema } from "../veterinarian-clinic.schema";

export const animalWithUserSchema = animalSchema.extend({
  client: userSchema,
});
export const animalMetaSchema = animalSchema.extend({
  client: clientSchema,
  age: z
    .object({
      years: z.number().nonnegative(),
      months: z.number().nonnegative(),
    })
    .optional(),
  race: raceMetaSchema,
});
export type AnimalMeta = z.infer<typeof animalMetaSchema>;
export const animalWithRaceMetaSchema = animalSchema.extend({
  race: raceMetaSchema,
});
export type AnimalWithRaceMeta = z.infer<typeof animalWithRaceMetaSchema>;
export type AnimalWithUser = z.infer<typeof animalWithUserSchema>;

export const animalDetailSchema = animalSchema.extend({
  animalConditionHealths: clientPetHealthConditionMetaSchema.array(),
  client: clientProfileSchema.extend({ user: baseUserSchema }),
  race: raceMetaSchema,
  animalVaccine: animalVaccineSchema.array(),
  attendingVeterinarianClinic: veterinarianClinicMetaSchema
    .extend({
      veterinarian: veterinarianProfileSchema.extend({
        user: baseUserSchema,
      }),
    })
    .nullable(),
});

export type AnimalDetail = z.infer<typeof animalDetailSchema>;
