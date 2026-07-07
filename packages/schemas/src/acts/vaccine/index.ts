import z from "zod";
import { actSchema } from "../act.schema";
import { minVaccineSchema } from "./vaccine.schema";

export const vaccineSchema = minVaccineSchema.extend({
  act: actSchema,
});

export type Vaccine = z.infer<typeof vaccineSchema>;
