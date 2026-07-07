import { z } from "zod";
import {
  veterinarianIdSchema,
  hospitalizationIdSchema,
  hospitalizationReportIdSchema,
} from "../ids";

export const hospitalizationReportSchema = z.object({
  id: hospitalizationReportIdSchema,
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  notes: z.string().min(1),
  weight: z.coerce.number().multipleOf(0.01).nullable().optional(),
  temperature: z.coerce.number().multipleOf(0.01).nullable().optional(),
  hospitalizationId: hospitalizationIdSchema,
  veterinarianId: veterinarianIdSchema,
});

export const createHospitalizationReportSchema =
  hospitalizationReportSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  });
export const updateHospitalizationReportSchema =
  createHospitalizationReportSchema.partial();

export const hospitalizationSchema = z.object({
  id: hospitalizationIdSchema,
  admittedAt: z.coerce.date(),
  dischargedAt: z.coerce.date().nullable().optional(),
  boxNumber: z.string().max(20).nullable().optional(),
  dailyReports: z.array(hospitalizationReportSchema).optional(),
});

export const createHospitalizationSchema = hospitalizationSchema.omit({
  id: true,
  dailyReports: true,
});
export const updateHospitalizationSchema =
  createHospitalizationSchema.partial();

export type Hospitalization = z.infer<typeof hospitalizationSchema>;
