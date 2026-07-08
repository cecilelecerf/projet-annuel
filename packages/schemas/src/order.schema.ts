import { z } from 'zod'
import { orderIdSchema, orderItemIdSchema, clientIdSchema, clinicIdSchema, productClinicIdSchema } from './ids'

// ── Order ─────────────────────────────────────────────────────────────────────
export const orderStatusSchema = z.enum(['PENDING', 'CONFIRMED', 'READY', 'PICKED_UP', 'CANCELLED'])

export const orderSchema = z.object({
  id:              orderIdSchema,
  clientId:        clientIdSchema,
  status:          orderStatusSchema,
  clinicId:        clinicIdSchema,
  pickupAt:        z.string().nullable().optional(),
  stripeSessionId: z.string().nullable().optional(),
  pickupCode:      z.string().nullable().optional(),
  createdAt:       z.string(),
})

export const createOrderSchema = orderSchema.omit({ id: true, createdAt: true })
export const updateOrderSchema = createOrderSchema.partial()

export type OrderStatus = z.infer<typeof orderStatusSchema>
export type Order       = z.infer<typeof orderSchema>
export type CreateOrder = z.infer<typeof createOrderSchema>
export type UpdateOrder = z.infer<typeof updateOrderSchema>

// ── OrderItem ─────────────────────────────────────────────────────────────────
export const orderItemSchema = z.object({
  id:              orderItemIdSchema,
  orderId:         orderIdSchema,
  productClinicId: productClinicIdSchema,
  quantity:        z.number().int().positive(),
  unitPrice:       z.coerce.number().nonnegative(),
})

export const createOrderItemSchema = orderItemSchema.omit({ id: true })
export const updateOrderItemSchema = createOrderItemSchema.partial()

export type OrderItem       = z.infer<typeof orderItemSchema>
export type CreateOrderItem = z.infer<typeof createOrderItemSchema>
export type UpdateOrderItem = z.infer<typeof updateOrderItemSchema>

// ── Checkout (création de commande(s) à partir du panier) ─────────────────────
export const checkoutItemSchema = z.object({
  productClinicId: productClinicIdSchema,
  quantity: z.number().int().positive(),
})

export const checkoutGroupSchema = z.object({
  clinicId: clinicIdSchema,
  items: z.array(checkoutItemSchema).min(1),
})

export const checkoutSchema = z.object({
  groups: z.array(checkoutGroupSchema).min(1),
})

export type CheckoutItem = z.infer<typeof checkoutItemSchema>
export type CheckoutGroup = z.infer<typeof checkoutGroupSchema>
export type Checkout = z.infer<typeof checkoutSchema>

// ── Vues hydratées (affichage récap / historique) ──────────────────────────────
export const orderItemWithProductSchema = orderItemSchema.extend({
  productClinic: z.object({
    product: z.object({
      name: z.string(),
      picture: z.url().nullable().optional(),
    }),
  }),
})

export const orderWithItemsSchema = orderSchema.extend({
  clinic: z.object({ name: z.string() }),
  orderItems: z.array(orderItemWithProductSchema),
})

export type OrderItemWithProduct = z.infer<typeof orderItemWithProductSchema>
export type OrderWithItems = z.infer<typeof orderWithItemsSchema>

// ── Réponse du checkout : commandes créées + URL de paiement Stripe ───────────
export const checkoutResultSchema = z.object({
  orders: z.array(orderWithItemsSchema),
  checkoutUrl: z.string(),
})

export type CheckoutResult = z.infer<typeof checkoutResultSchema>

// ── Secrétaire ───────────
export const orderWithClientSchema = orderWithItemsSchema.extend({
  client: z.object({
    firstname: z.string(),
    lastname: z.string(),
    email: z.string(),
  }),
})
 
export type OrderWithClient = z.infer<typeof orderWithClientSchema>
 
// Remise du colis via le code donné par le client
export const deliverOrderSchema = z.object({
  pickupCode: z.string().min(1, "Code requis"),
})
 
export type DeliverOrder = z.infer<typeof deliverOrderSchema>