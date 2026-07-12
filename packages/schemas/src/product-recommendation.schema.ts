import { z } from 'zod'
import { animalIdSchema, clinicProductIdSchema } from './ids'

export const animalOptionSchema = z.object({
  id: animalIdSchema,
  name: z.string(),
})

export const productRecommendationSchema = z.object({
  clinicProductId: clinicProductIdSchema,
  recommendation: z.enum(['RECOMMENDED', 'AVOID']).nullable(),
  matchedConditions: z.array(z.string()),
  dailyGrams: z.number().nullable(),
})

export type AnimalOption = z.infer<typeof animalOptionSchema>
export type ProductRecommendation = z.infer<typeof productRecommendationSchema>