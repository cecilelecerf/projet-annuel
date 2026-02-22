import { z } from 'zod'
import { reviewIdSchema, clientIdSchema, veterinarianClinicIdSchema } from './ids'

// ── Review ────────────────────────────────────────────────────────────────────
export const reviewSchema = z.object({
  id:                   reviewIdSchema,
  clientId:             clientIdSchema,
  clinicVeterinarianId: veterinarianClinicIdSchema,
  rating:               z.number().int().min(1).max(5),
  comment:              z.string().min(1).max(255),
})

export const createReviewSchema = reviewSchema.omit({ id: true })
export const updateReviewSchema = createReviewSchema.partial()

export type Review       = z.infer<typeof reviewSchema>
export type CreateReview = z.infer<typeof createReviewSchema>
export type UpdateReview = z.infer<typeof updateReviewSchema>
