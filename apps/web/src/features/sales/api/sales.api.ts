import { http } from '@/lib/api'
import { salesReportSchema, type SalesReport } from '@armali/schemas'

export const salesApi = {
  getReport: async (from?: string, to?: string): Promise<SalesReport> => {
    const params = new URLSearchParams()
    if (from) params.set('from', from)
    if (to) params.set('to', to)
    const query = params.toString() ? `?${params.toString()}` : ''
    const data = await http.get(`/sales${query}`)
    return salesReportSchema.parse(data)
  },
}