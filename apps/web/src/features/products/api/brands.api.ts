import { http } from '@/lib/api'
import type { Brand, CreateBrand } from '@armali/schemas'

export const brandsApi = {
  search: (query: string) =>
    http.get<Brand[]>(`/brands?search=${encodeURIComponent(query)}`),

  // Crée la marque si elle n'existe pas déjà (le backend gère la déduplication par nom)
  create: (name: string) => http.post<Brand>('/brands', { name } satisfies CreateBrand),
}