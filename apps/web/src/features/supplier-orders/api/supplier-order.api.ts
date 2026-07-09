import { http } from '@/lib/api'
import {
  supplierOrderWithDetailsSchema,
  type SupplierOrderWithDetails,
  type CreateSupplierOrder,
  type SupplierOrderStatus,
} from '@armali/schemas'

export const supplierOrderApi = {
  getAll: async (status?: SupplierOrderStatus): Promise<SupplierOrderWithDetails[]> => {
    const url = status ? `/supplier-orders?status=${status}` : '/supplier-orders'
    const data = await http.get(url)
    return supplierOrderWithDetailsSchema.array().parse(data)
  },
  getById: async (id: string): Promise<SupplierOrderWithDetails> => {
    const data = await http.get(`/supplier-orders/${id}`)
    return supplierOrderWithDetailsSchema.parse(data)
  },
  create: async (payload: CreateSupplierOrder): Promise<SupplierOrderWithDetails> => {
    const data = await http.post('/supplier-orders', payload)
    return supplierOrderWithDetailsSchema.parse(data)
  },
  markReceived: async (id: string): Promise<SupplierOrderWithDetails> => {
    const data = await http.patch(`/supplier-orders/${id}/receive`, {})
    return supplierOrderWithDetailsSchema.parse(data)
  },
  cancel: async (id: string): Promise<SupplierOrderWithDetails> => {
    const data = await http.patch(`/supplier-orders/${id}/cancel`, {})
    return supplierOrderWithDetailsSchema.parse(data)
  },
}