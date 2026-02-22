import { z } from 'zod'
import { healthConditionIdSchema, ownedPetIdSchema, meetingIdSchema, userIdSchema, foodIdSchema, petFoodIdSchema } from './ids'

// ── ClientPetHealthCondition ──────────────────────────────────────────────────
export const clientPetHealthConditionSchema = z.object({
  id:                z.string().uuid().brand('ClientPetHealthConditionId'),
  healthConditionId: healthConditionIdSchema,
  ownedPetId:        ownedPetIdSchema,
  diagnosedAt:       z.string().datetime(),
  notes:             z.string().min(1).max(255),
  meetingId:         meetingIdSchema.nullable().optional(),
  addedBy:           userIdSchema,
})

export const createClientPetHealthConditionSchema = clientPetHealthConditionSchema.omit({ id: true })
export const updateClientPetHealthConditionSchema = createClientPetHealthConditionSchema.partial()

export type ClientPetHealthCondition       = z.infer<typeof clientPetHealthConditionSchema>
export type CreateClientPetHealthCondition = z.infer<typeof createClientPetHealthConditionSchema>
export type UpdateClientPetHealthCondition = z.infer<typeof updateClientPetHealthConditionSchema>

// ── PetFood (alimentation d'un animal) ───────────────────────────────────────
export const petFoodSchema = z.object({
  id:         petFoodIdSchema,
  createdAt:  z.string().datetime(),
  updatedAt:  z.string().datetime(),
  foodId:     foodIdSchema,
  clientPetId: ownedPetIdSchema,
  day:        z.number().int().min(1).max(7),           // jour de la semaine
  dateStart:  z.string().datetime(),
  dateEnd:    z.string().datetime().nullable().optional(),
  quantity:   z.number().positive(),
  hours:      z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/), // TIME HH:mm
})

export const createPetFoodSchema = petFoodSchema.omit({ id: true, createdAt: true, updatedAt: true })
export const updatePetFoodSchema = createPetFoodSchema.partial()

export type PetFood       = z.infer<typeof petFoodSchema>
export type CreatePetFood = z.infer<typeof createPetFoodSchema>
export type UpdatePetFood = z.infer<typeof updatePetFoodSchema>
