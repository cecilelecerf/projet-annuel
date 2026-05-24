import z from "zod";
import { medicalHistorySchema } from "../animal-medical-history.schema";
import { animalVaccineSchema } from "../animal-vaccination.schema";

const vaccineMetaStatus = z.enum([
  "MANDATORY_MISSING",
  "RECOMMENDED_MISSING",
  "NOT_APPLICABLE",
  "UP_TO_DATE",
  "OVERDUE",
]);

export const vaccineMetaSchema = animalVaccineSchema
  .omit({ medicalHistoryId: true, id: true, createdAt: true, updatedAt: true })
  .extend({
    id: animalVaccineSchema.shape.id.nullable(),
    medicalHistory: medicalHistorySchema
      .pick({
        performedAt: true,
        clinicActId: true,
      })
      .nullable(),
    nextDue: z.coerce.date().nullable(),
    isUpToDate: z.boolean(),
    daysUntilDue: z.number().int().nullable(),
    status: vaccineMetaStatus,
  });

export type VaccineMeta = z.infer<typeof vaccineMetaSchema>;
