import { z } from 'zod'
import { orderItemWithProductSchema, orderSchema } from './order.schema'

export const salesSummarySchema = z.object({
  totalRevenue: z.number().nonnegative(),
  orderCount: z.number().int().nonnegative(),
  averageOrderValue: z.number().nonnegative(),
})

export const revenuePointSchema = z.object({
  date: z.string(),
  revenue: z.number().nonnegative(),
})

export const topProductSchema = z.object({
  productName: z.string(),
  quantitySold: z.number().int().nonnegative(),
  revenue: z.number().nonnegative(),
})

// Commande + client, pour l'affichage détaillé dans la liste des ventes
export const salesOrderSchema = orderSchema.extend({
  clinic: z.object({ name: z.string() }),
  orderItems: z.array(orderItemWithProductSchema),
  client: z.object({
    firstname: z.string(),
    lastname: z.string(),
    email: z.string(),
  }),
})

export const salesReportSchema = z.object({
  summary: salesSummarySchema,
  revenueOverTime: z.array(revenuePointSchema),
  topProducts: z.array(topProductSchema),
  orders: z.array(salesOrderSchema),
})

export type SalesSummary = z.infer<typeof salesSummarySchema>
export type RevenuePoint = z.infer<typeof revenuePointSchema>
export type TopProduct = z.infer<typeof topProductSchema>
export type SalesOrder = z.infer<typeof salesOrderSchema>
export type SalesReport = z.infer<typeof salesReportSchema>