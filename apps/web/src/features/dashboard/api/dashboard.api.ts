import { http } from '@/lib/api'
import type { ReferentDashboard } from '@armali/schemas'

export const dashboardApi = {
  get: () => http.get<ReferentDashboard>('/referent/dashboard'),
}