import { z } from "zod";
import {
  animalIdSchema,
  vaccineIdSchema,
  petVaccineIdSchema,
  medicalHistoryIdSchema,
} from "../ids";
import { vaccineSchema as vaccineSchema } from "./vaccine";
import { medicalHistorySchema } from "./animal-medical-history.schema";

export const animalVaccineSchema = z.object({
  id: petVaccineIdSchema,
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  animalId: animalIdSchema,
  vaccineId: vaccineIdSchema,
  vaccine: vaccineSchema.optional(),
  medicalHistoryId: medicalHistoryIdSchema.nullable().optional(),
});

export const createAnimalVaccineSchema = animalVaccineSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  vaccine: true,
});

export const createAnimalVaccineHistoricalSchema =
  createAnimalVaccineSchema.omit({
    medicalHistoryId: true,
  });

export type AnimalVaccine = z.infer<typeof animalVaccineSchema>;
export type CreateAnimalVaccine = z.infer<typeof createAnimalVaccineSchema>;
export type CreateAnimalVaccineHistorical = z.infer<
  typeof createAnimalVaccineHistoricalSchema
>;
