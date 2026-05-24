import z from "zod";
import { medicalHistorySchema } from "../animal-medical-history.schema";
import { animalVaccineSchema } from "../animal-vaccination.schema";

export const vaccineMetaSchema = animalVaccineSchema
  .extend({
    medicalHistory: medicalHistorySchema.pick({
      performedAt: true,
      clinicActId: true,
    }),
    nextDue: z.coerce.date(),
    isUpToDate: z.boolean(),
    daysUntilDue: z.number().int(),
  })
  .omit({ medicalHistoryId: true });

export type VaccineMeta = z.infer<typeof vaccineMetaSchema>;
