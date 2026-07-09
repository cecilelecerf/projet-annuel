import { http } from '@/lib/api'
import { budgetSummarySchema, type BudgetSummary, type CreditBudget } from '@armali/schemas'

export const budgetApi = {
  get: async (): Promise<BudgetSummary> => {
    const data = await http.get('/budget')
    return budgetSummarySchema.parse(data)
  },
  credit: async (payload: CreditBudget) => {
    return await http.post('/budget/credit', payload)
  },
}