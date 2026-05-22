import z from "zod";
import { clinicIdSchema, directorClinicIdSchema } from "../ids";
import { baseUserSchema } from "./base-user.schema";

export const directorClinicSchema = baseUserSchema.extend({
  id: directorClinicIdSchema,
  clinicId: clinicIdSchema,
  role: z.literal("DIRECTOR"),
});

export const createDirectorClinicSchema = directorClinicSchema.omit({
  id: true,
});

export type DirectorClinic = z.infer<typeof directorClinicSchema>;
export type CreateDirectorClinic = z.infer<typeof createDirectorClinicSchema>;
