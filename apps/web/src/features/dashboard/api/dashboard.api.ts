import { http } from '@/lib/api'
import { referentDashboardSchema } from '@armali/schemas'

export const dashboardApi = {
  get: async () => {
    return await http.get('/referent/dashboard').then((data) => referentDashboardSchema.parse(data))
  },
}
