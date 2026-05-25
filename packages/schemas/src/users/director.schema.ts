import { z } from "zod";
import { directorClinicIdSchema, clinicIdSchema } from "../ids";
import { baseUserSchema } from "./base-user.schema";

export const directorProfileSchema = z.object({
  id: directorClinicIdSchema,
  clinicId: clinicIdSchema,
});

export const directorSchema = baseUserSchema.extend({
  role: z.literal("DIRECTOR"),
  directorClinicProfile: directorProfileSchema.nullable().optional(),
  clinicId: clinicIdSchema.nullable().optional(),
});

export const createDirectorSchema = directorProfileSchema.omit({ id: true });
export const updateDirectorSchema = createDirectorSchema.partial();

export type DirectorProfile = z.infer<typeof directorProfileSchema>;
export type Director = z.infer<typeof directorSchema>;
export type CreateDirector = z.infer<typeof createDirectorSchema>;
export type UpdateDirector = z.infer<typeof updateDirectorSchema>;
