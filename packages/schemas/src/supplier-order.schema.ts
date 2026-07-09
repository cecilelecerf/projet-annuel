import { z } from 'zod'
import {
  supplierOrderIdSchema,
  supplierOrderItemIdSchema,
  supplierIdSchema,
  clinicIdSchema,
  userIdSchema,
  productIdSchema,
} from './ids'

export const supplierOrderStatusSchema = z.enum(['PENDING', 'RECEIVED', 'CANCELLED'])

// ── SupplierOrderItem ─────────────────────────────────────────────────────────

export const supplierOrderItemSchema = z.object({
  id: supplierOrderItemIdSchema,
  quantity: z.number().int().positive(),
  unitCost: z.coerce.number().nonnegative(),
  supplierOrderId: supplierOrderIdSchema,
  productId: productIdSchema,
})

// ── SupplierOrder ─────────────────────────────────────────────────────────────

export const supplierOrderSchema = z.object({
  id: supplierOrderIdSchema,
  status: supplierOrderStatusSchema,
  receivedAt: z.string().nullable().optional(),
  clinicId: clinicIdSchema,
  supplierId: supplierIdSchema,
  createdById: userIdSchema,
  createdAt: z.string(),
})

// Payload de création : juste le fournisseur + les lignes (quantité, pas le
// prix — le prix d'achat est récupéré depuis le catalogue du fournisseur)
export const createSupplierOrderItemSchema = z.object({
  productId: productIdSchema,
  quantity: z.number().int().positive(),
})

export const createSupplierOrderSchema = z.object({
  supplierId: supplierIdSchema,
  items: z.array(createSupplierOrderItemSchema).min(1),
})

// ── Vues hydratées ────────────────────────────────────────────────────────────

export const supplierOrderItemWithProductSchema = supplierOrderItemSchema.extend({
  product: z.object({
    name: z.string(),
    picture: z.url().nullable().optional(),
  }),
})

export const supplierOrderWithDetailsSchema = supplierOrderSchema.extend({
  supplier: z.object({ name: z.string() }),
  items: z.array(supplierOrderItemWithProductSchema),
  total: z.number().nonnegative(),
})

export type SupplierOrderStatus = z.infer<typeof supplierOrderStatusSchema>
export type SupplierOrderItem = z.infer<typeof supplierOrderItemSchema>
export type SupplierOrder = z.infer<typeof supplierOrderSchema>
export type CreateSupplierOrderItem = z.infer<typeof createSupplierOrderItemSchema>
export type CreateSupplierOrder = z.infer<typeof createSupplierOrderSchema>
export type SupplierOrderItemWithProduct = z.infer<
  typeof supplierOrderItemWithProductSchema
>
export type SupplierOrderWithDetails = z.infer<
  typeof supplierOrderWithDetailsSchema
>