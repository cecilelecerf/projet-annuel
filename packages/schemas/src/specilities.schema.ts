import z from "zod";
import { specialityIdSchema } from "./ids";

// ── Speciality ────────────────────────────────────────────────────────────────
export const specialitySchema = z.object({
  id: specialityIdSchema,
  name: z.string().min(1).max(255),
  description: z.string().min(1).max(255),
});

export const createSpecialitySchema = specialitySchema.omit({ id: true });
export const updateSpecialitySchema = createSpecialitySchema.partial();

export type Speciality = z.infer<typeof specialitySchema>;
export type CreateSpeciality = z.infer<typeof createSpecialitySchema>;
export type UpdateSpeciality = z.infer<typeof updateSpecialitySchema>;
