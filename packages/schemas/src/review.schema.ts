import { z } from "zod";
import {
  clientIdSchema,
  reviewIdSchema,
  veterinarianClinicIdSchema,
} from "./ids";
import { baseUserSchema } from "./users/base-user.schema";
import { clinicSchema } from "./clinics/clinic.schema";

export const reviewSchema = z.object({
  id: reviewIdSchema,
  veterinarianClinicId: veterinarianClinicIdSchema,
  clientId: clientIdSchema,
  rating: z.coerce
    .number()
    .positive()
    .min(1, "Note minimum 1")
    .max(5, "Note maximum 5"),
  comment: z.string().max(500).optional().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const reviewMetaSchema = reviewSchema.extend({
  client: baseUserSchema,
  clinic: clinicSchema,
  veterinarian: baseUserSchema,
});
export type ReviewMeta = z.infer<typeof reviewMetaSchema>;

export const reviewStatSchema = z.object({
  average: z.number().nonnegative().nullable(),
  count: z.number().int().nonnegative(),
});
export type ReviewStat = z.infer<typeof reviewStatSchema>;

// EDITON
export const createReviewSchema = reviewSchema.pick({
  rating: true,
  veterinarianClinicId: true,
  comment: true,
});

export const updateReviewSchema = createReviewSchema
  .omit({ veterinarianClinicId: true })
  .partial();

export type Review = z.infer<typeof reviewSchema>;
export type CreateReview = z.infer<typeof createReviewSchema>;
export type UpdateReview = z.infer<typeof updateReviewSchema>;
