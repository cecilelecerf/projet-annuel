import { http } from '@/lib/api'
import {
  productClinicWithClinicSchema,
  type ProductClinicWithClinic,
} from '@armali/schemas'

export const clientShopApi = {
  getAll: async (): Promise<ProductClinicWithClinic[]> => {
    const data = await http.get('/shop')
    return productClinicWithClinicSchema.array().parse(data)
  },

  getById: async (id: string): Promise<ProductClinicWithClinic> => {
    const data = await http.get(`/shop/${id}`)
    return productClinicWithClinicSchema.parse(data)
  },
}