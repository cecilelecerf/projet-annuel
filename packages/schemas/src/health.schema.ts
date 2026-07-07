import { z } from "zod";
import {
  healthConditionIdSchema,
  animalIdSchema,
  meetingIdSchema,
  userIdSchema,
  foodIdSchema,
  petFoodIdSchema,
  clientPetHealthConditionIdSchema,
} from "./ids";

// ── ClientPetHealthCondition ──────────────────────────────────────────────────
export const clientPetHealthConditionSchema = z.object({
  id: clientPetHealthConditionIdSchema,
  healthConditionId: healthConditionIdSchema,
  animalId: animalIdSchema,
  diagnosedAt: z.coerce.date(),
  notes: z.string().min(1).max(255),
  meetingId: meetingIdSchema.nullable().optional(),
  addedBy: userIdSchema,
});

export const createClientPetHealthConditionSchema =
  clientPetHealthConditionSchema.omit({ id: true });
export const updateClientPetHealthConditionSchema =
  createClientPetHealthConditionSchema.partial();

export type ClientPetHealthCondition = z.infer<
  typeof clientPetHealthConditionSchema
>;
export type CreateClientPetHealthCondition = z.infer<
  typeof createClientPetHealthConditionSchema
>;
export type UpdateClientPetHealthCondition = z.infer<
  typeof updateClientPetHealthConditionSchema
>;

// ── PetFood (alimentation d'un animal) ───────────────────────────────────────
export const petFoodSchema = z.object({
  id: petFoodIdSchema,
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  foodId: foodIdSchema,
  clientPetId: animalIdSchema,
  day: z.number().int().min(1).max(7), // jour de la semaine
  dateStart: z.coerce.date(),
  dateEnd: z.coerce.date().nullable().optional(),
  quantity: z.number().positive(),
  hours: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/), // TIME HH:mm
});

export const createPetFoodSchema = petFoodSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const updatePetFoodSchema = createPetFoodSchema.partial();

export type PetFood = z.infer<typeof petFoodSchema>;
export type CreatePetFood = z.infer<typeof createPetFoodSchema>;
export type UpdatePetFood = z.infer<typeof updatePetFoodSchema>;
