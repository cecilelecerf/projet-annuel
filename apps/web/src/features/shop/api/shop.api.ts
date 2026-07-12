import { http } from '@/lib/api'
import {
  productClinicWithClinicSchema,
  type ProductClinicWithClinic,
} from '@armali/schemas'
import { animalOptionSchema, productRecommendationSchema } from '@armali/schemas'
import type { AnimalOption, ProductRecommendation } from '@armali/schemas'

export const clientShopApi = {
  getAll: async (): Promise<ProductClinicWithClinic[]> => {
    const data = await http.get('/shop')
    return productClinicWithClinicSchema.array().parse(data)
  },

  getById: async (id: string): Promise<ProductClinicWithClinic> => {
    const data = await http.get(`/shop/${id}`)
    return productClinicWithClinicSchema.parse(data)
  },

  getAnimals: async (): Promise<AnimalOption[]> => {
    const data = await http.get('/shop/animals')
    return animalOptionSchema.array().parse(data)
  },
 
  getRecommendations: async (animalId: string): Promise<ProductRecommendation[]> => {
    const data = await http.get(`/shop/recommendations/${animalId}`)
    return productRecommendationSchema.array().parse(data)
  },
}