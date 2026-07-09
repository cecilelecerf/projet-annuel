import { z } from 'zod'
import {
  budgetTransactionIdSchema,
  clinicIdSchema,
  userIdSchema,
  supplierOrderIdSchema,
} from './ids'

export const budgetTransactionTypeSchema = z.enum(['CREDIT', 'DEBIT', 'REFUND'])

export const budgetTransactionSchema = z.object({
  id: budgetTransactionIdSchema,
  type: budgetTransactionTypeSchema,
  amount: z.coerce.number(),
  reason: z.string().nullable().optional(),
  clinicId: clinicIdSchema,
  createdById: userIdSchema,
  supplierOrderId: supplierOrderIdSchema.nullable().optional(),
  createdAt: z.string(),
})

// Payload pour créditer le budget manuellement
export const creditBudgetSchema = z.object({
  amount: z.number().positive(),
  reason: z.string().optional(),
})

// Vue "hydratée" avec le nom de l'auteur, pour l'historique
export const budgetTransactionWithAuthorSchema = budgetTransactionSchema.extend({
  createdBy: z.object({
    firstname: z.string(),
    lastname: z.string(),
  }),
})

export const budgetSummarySchema = z.object({
  balance: z.number(),
  transactions: z.array(budgetTransactionWithAuthorSchema),
})

export type BudgetTransactionType = z.infer<typeof budgetTransactionTypeSchema>
export type BudgetTransaction = z.infer<typeof budgetTransactionSchema>
export type CreditBudget = z.infer<typeof creditBudgetSchema>
export type BudgetTransactionWithAuthor = z.infer<
  typeof budgetTransactionWithAuthorSchema
>
export type BudgetSummary = z.infer<typeof budgetSummarySchema>