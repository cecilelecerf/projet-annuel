import { http } from '@/lib/api'

export interface VeterinarianStat {
  id: string
  firstname: string
  lastname: string
  averageRating: number | null
  reviewCount: number
}

export interface ReferentDashboard {
  clinic: {
    name: string
    veterinarianCount: number
    secretaryCount: number
  }
  reviews: {
    clinicAverageRating: number | null
    totalReviews: number
    veterinarianStats: VeterinarianStat[]
  }
  sales: {
    totalRevenue: number
    totalOrdersCount: number
    recentOrdersCount: number
    lowStockCount: number
  }
}

export const dashboardApi = {
  get: () => http.get<ReferentDashboard>('/referent/dashboard'),
}