import { z } from "zod";
import { reviewIdSchema, veterinarianIdSchema } from "./ids";

export const reviewSchema = z.object({
  id: reviewIdSchema,
  veterinarianId: veterinarianIdSchema,
  rating: z.number().int().min(1, "Note minimum 1").max(5, "Note maximum 5"),
  comment: z.string().max(500).optional(),
});

export const createReviewSchema = z.object({
  veterinarianId: z.string().uuid("ID vétérinaire invalide"),
  rating: z.number().int().min(1, "Note minimum 1").max(5, "Note maximum 5"),
  comment: z.string().max(500).optional(),
});

export const updateReviewSchema = createReviewSchema.omit({ veterinarianId: true }).partial();

export type Review = z.infer<typeof reviewSchema>;
export type CreateReview = z.infer<typeof createReviewSchema>;
export type UpdateReview = z.infer<typeof updateReviewSchema>;
