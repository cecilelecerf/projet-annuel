import { z } from "zod";
import {
  prescriptionIdSchema,
  prescriptionItemIdSchema,
  meetingIdSchema,
  veterinarianIdSchema,
  clinicProductIdSchema,
} from "./ids";
import { productClinicSchema } from "./product.schema";

export const prescriptionStatusSchema = z.enum([
  "ACTIVE",
  "COMPLETED",
  "CANCELLED",
]);

export const prescriptionItemSchema = z.object({
  id: prescriptionItemIdSchema,
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  medicationName: z.string().min(1).max(255),
  dosage: z.string().min(1).max(100),
  frequency: z.string().min(1).max(100),
  duration: z.number().int().positive().nullable().optional(),
  instructions: z.string().max(500).nullable().optional(),
  prescriptionId: prescriptionIdSchema,
  clinicProductId: clinicProductIdSchema.nullable().optional(),
  clinicProduct: productClinicSchema.optional().nullable(),
});

export const createPrescriptionItemSchema = prescriptionItemSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  prescriptionId: true,
  clinicProduct: true,
});
export const updatePrescriptionItemSchema =
  createPrescriptionItemSchema.partial();

export const prescriptionSchema = z.object({
  id: prescriptionIdSchema,
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().nullable().optional(),
  status: prescriptionStatusSchema,
  notes: z.string().nullable().optional(),
  animalMeetingId: meetingIdSchema,
  veterinarianId: veterinarianIdSchema,
  items: z.array(prescriptionItemSchema).optional(),
});

export const createPrescriptionSchema = prescriptionSchema
  .omit({ id: true, createdAt: true, updatedAt: true, items: true })
  .extend({
    items: z.array(createPrescriptionItemSchema).min(1),
  });

export const updatePrescriptionSchema = prescriptionSchema
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    animalMeetingId: true,
    items: true,
  })
  .partial()
  .extend({
    items: z.array(createPrescriptionItemSchema).optional(),
  });

export type PrescriptionStatus = z.infer<typeof prescriptionStatusSchema>;
export type PrescriptionItem = z.infer<typeof prescriptionItemSchema>;
export type CreatePrescriptionItem = z.infer<
  typeof createPrescriptionItemSchema
>;
export type Prescription = z.infer<typeof prescriptionSchema>;
export type CreatePrescription = z.infer<typeof createPrescriptionSchema>;
export type UpdatePrescription = z.infer<typeof updatePrescriptionSchema>;
