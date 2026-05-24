import z from "zod";
import { ownedPetSchema } from "../owned-pet/index.schema";
import { userSchema } from "../users";
import { raceMetaSchema } from "../pet.schema";

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

export const ownedPetWithRaceMeta = ownedPetSchema.extend({
  race: raceMetaSchema,
});
export type OwnedPetWithUser = z.infer<typeof ownedPetWithUserSchema>;
