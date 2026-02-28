import { z } from 'zod'
import { orderIdSchema, orderItemIdSchema, clientIdSchema, clinicIdSchema, productClinicIdSchema } from './ids'

// ── Order ─────────────────────────────────────────────────────────────────────
export const orderStatusSchema = z.enum(['pending', 'confirmed', 'ready', 'picked_up', 'cancelled'])

export const orderSchema = z.object({
  id:       orderIdSchema,
  clientId: clientIdSchema,
  status:   orderStatusSchema,
  clinicId: clinicIdSchema,
  pickupAt: z.string().datetime().nullable().optional(),
})

export const createOrderSchema = orderSchema.omit({ id: true })
export const updateOrderSchema = createOrderSchema.partial()

export type OrderStatus = z.infer<typeof orderStatusSchema>
export type Order       = z.infer<typeof orderSchema>
export type CreateOrder = z.infer<typeof createOrderSchema>
export type UpdateOrder = z.infer<typeof updateOrderSchema>

// ── OrderItem ─────────────────────────────────────────────────────────────────
export const orderItemSchema = z.object({
  id:             orderItemIdSchema,
  orderId:        orderIdSchema,
  productClinicId: productClinicIdSchema,
  quantity:       z.number().int().positive(),
  unitPrice:      z.number().nonnegative(),
})

export const createOrderItemSchema = orderItemSchema.omit({ id: true })
export const updateOrderItemSchema = createOrderItemSchema.partial()

export type OrderItem       = z.infer<typeof orderItemSchema>
export type CreateOrderItem = z.infer<typeof createOrderItemSchema>
export type UpdateOrderItem = z.infer<typeof updateOrderItemSchema>
