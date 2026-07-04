import { http } from '@/lib/api'
import { brandSchema, type Brand, type CreateBrand } from '@armali/schemas'

export const brandsApi = {
  search: async (query: string): Promise<Brand[]> => {
    const data = await http.get(`/brands?search=${encodeURIComponent(query)}`)
    return brandSchema.array().parse(data)
  },

  // Crée la marque si elle n'existe pas déjà (le backend gère la déduplication par nom)
  create: async (name: string): Promise<Brand> => {
    const payload: CreateBrand = { name }
    const data = await http.post('/brands', payload)
    return brandSchema.parse(data)
  },
}