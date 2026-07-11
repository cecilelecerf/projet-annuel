import { z } from 'zod'
import {
  supplierIdSchema,
  supplierProductIdSchema,
  productIdSchema,
} from './ids'

// ── Supplier (catalogue global, géré par l'admin) ───────────────────────────

export const supplierSchema = z.object({
  id: supplierIdSchema,
  name: z.string().min(1),
  email: z.email().nullable().optional(),
  phone: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
})

export const createSupplierSchema = supplierSchema.omit({ id: true })
export const updateSupplierSchema = createSupplierSchema.partial()

export type Supplier = z.infer<typeof supplierSchema>
export type CreateSupplier = z.infer<typeof createSupplierSchema>
export type UpdateSupplier = z.infer<typeof updateSupplierSchema>

// ── SupplierProduct (catalogue de prix d'achat) ─────────────────────────────

export const supplierProductSchema = z.object({
  id: supplierProductIdSchema,
  costPrice: z.coerce.number().nonnegative(),
  supplierId: supplierIdSchema,
  productId: productIdSchema,
})

export const createSupplierProductSchema = z.object({
  productId: productIdSchema,
  costPrice: z.number().nonnegative(),
})
export const updateSupplierProductSchema = z.object({
  costPrice: z.number().nonnegative(),
})

export type SupplierProduct = z.infer<typeof supplierProductSchema>
export type CreateSupplierProduct = z.infer<typeof createSupplierProductSchema>
export type UpdateSupplierProduct = z.infer<typeof updateSupplierProductSchema>

// ── Vues hydratées ────────────────────────────────────────────────────────────

export const supplierProductWithProductSchema = supplierProductSchema.extend({
  product: z.object({
    id: productIdSchema,
    name: z.string(),
    picture: z.url().nullable().optional(),
    brand: z.object({ name: z.string() }),
  }),
})

export const supplierWithProductsSchema = supplierSchema.extend({
  supplierProducts: z.array(supplierProductWithProductSchema),
})

export type SupplierProductWithProduct = z.infer<
  typeof supplierProductWithProductSchema
>
export type SupplierWithProducts = z.infer<typeof supplierWithProductsSchema>