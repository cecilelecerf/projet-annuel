import { http } from '@/lib/api'

export interface Brand {
  id: string
  name: string
  logo?: string | null
}

export const brandsApi = {
  search: (query: string) =>
    http.get<Brand[]>(`/brands?search=${encodeURIComponent(query)}`),

  create: (name: string) => http.post<Brand>('/brands', { name }),
}