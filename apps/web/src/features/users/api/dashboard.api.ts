import { http } from '@/lib/api'
import { dashboardSchema, type Dashboard } from '@armali/schemas'

export const dashboardApi = {
  get: async (): Promise<Dashboard> => {
    const data = await http.get('/dashboard')
    return dashboardSchema.parse(data)
  },
}