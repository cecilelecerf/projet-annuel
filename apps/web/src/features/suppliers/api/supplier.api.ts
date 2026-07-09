import { http } from '@/lib/api'
import {
  supplierWithProductsSchema,
  supplierProductSchema,
  type SupplierWithProducts,
  type SupplierProduct,
  type CreateSupplier,
  type UpdateSupplier,
  type CreateSupplierProduct,
  type UpdateSupplierProduct,
} from '@armali/schemas'

export const supplierApi = {
  getAll: async (): Promise<SupplierWithProducts[]> => {
    const data = await http.get('/suppliers')
    return supplierWithProductsSchema.array().parse(data)
  },
  getById: async (id: string): Promise<SupplierWithProducts> => {
    const data = await http.get(`/suppliers/${id}`)
    return supplierWithProductsSchema.parse(data)
  },
  create: async (payload: CreateSupplier): Promise<SupplierWithProducts> => {
    const data = await http.post('/suppliers', payload)
    return supplierWithProductsSchema.parse(data)
  },
  update: async (id: string, payload: UpdateSupplier): Promise<SupplierWithProducts> => {
    const data = await http.patch(`/suppliers/${id}`, payload)
    return supplierWithProductsSchema.parse(data)
  },
  delete: async (id: string) => {
    return await http.delete(`/suppliers/${id}`)
  },
  addProduct: async (
    supplierId: string,
    payload: CreateSupplierProduct,
  ): Promise<SupplierProduct> => {
    const data = await http.post(`/suppliers/${supplierId}/products`, payload)
    return supplierProductSchema.parse(data)
  },
  updateProduct: async (
    supplierId: string,
    productLinkId: string,
    payload: UpdateSupplierProduct,
  ): Promise<SupplierProduct> => {
    const data = await http.patch(
      `/suppliers/${supplierId}/products/${productLinkId}`,
      payload,
    )
    return supplierProductSchema.parse(data)
  },
  removeProduct: async (supplierId: string, productLinkId: string) => {
    return await http.delete(`/suppliers/${supplierId}/products/${productLinkId}`)
  },
}