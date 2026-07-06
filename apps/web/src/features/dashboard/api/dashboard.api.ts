import { http } from '@/lib/api'
import { referentDashboardSchema, type ReferentDashboard } from '@armali/schemas'

export const dashboardApi = {
  get: async (): Promise<ReferentDashboard> => {
    const data = await http.get('/referent/dashboard')
    return referentDashboardSchema.parse(data)
  },
}