import { http } from '@/lib/api'
import {
  productRequestWithRelationsSchema,
  type ProductRequestWithRelations,
  type CreateProductRequest,
  type ProductRequestStatus,
  type RejectProductRequest,
} from '@armali/schemas'

export const productRequestsApi = {
  // ── Référent / Directeur ─────────────────────────────────────────────
  getMine: async (): Promise<ProductRequestWithRelations[]> => {
    const data = await http.get('/product-requests/mine')
    return productRequestWithRelationsSchema.array().parse(data)
  },

  create: async (payload: CreateProductRequest): Promise<ProductRequestWithRelations> => {
    const data = await http.post('/product-requests', payload)
    return productRequestWithRelationsSchema.parse(data)
  },

  // ── Admin ─────────────────────────────────────────────────────────────
  getAll: async (status?: ProductRequestStatus): Promise<ProductRequestWithRelations[]> => {
    const query = status ? `?status=${status}` : ''
    const data = await http.get(`/product-requests${query}`)
    return productRequestWithRelationsSchema.array().parse(data)
  },

  approve: async (id: string): Promise<ProductRequestWithRelations> => {
    const data = await http.patch(`/product-requests/${id}/approve`, {})
    return productRequestWithRelationsSchema.parse(data)
  },

  reject: async (
    id: string,
    payload: RejectProductRequest,
  ): Promise<ProductRequestWithRelations> => {
    const data = await http.patch(`/product-requests/${id}/reject`, payload)
    return productRequestWithRelationsSchema.parse(data)
  },
}