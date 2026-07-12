import { http } from '@/lib/api'
import {
  productWithBrandSchema,
  productClinicWithProductSchema,
  type ProductWithBrand,
  type ProductClinicWithProduct,
  type CreateProduct,
  type UpdateProduct,
  type CreateProductClinic,
  type UpdateProductClinic,
  type RestockProductClinic,
} from '@armali/schemas'

export const productsApi = {
  // Catalogue global
  getAll: async (): Promise<ProductWithBrand[]> => {
    const data = await http.get('/products')
    return productWithBrandSchema.array().parse(data)
  },

  create: async (data: CreateProduct): Promise<ProductWithBrand> => {
    const result = await http.post('/products', data)
    return productWithBrandSchema.parse(result)
  },

  update: async (id: string, data: UpdateProduct): Promise<ProductWithBrand> => {
    const result = await http.patch(`/products/${id}`, data)
    return productWithBrandSchema.parse(result)
  },

  // Stock par clinique
  getClinicProducts: async (clinicId: string): Promise<ProductClinicWithProduct[]> => {
    const data = await http.get(`/products/clinic-products/${clinicId}`)
    return productClinicWithProductSchema.array().parse(data)
  },

  // Produits sous leur seuil minimum, pour les notifications
  getLowStock: async (clinicId: string): Promise<ProductClinicWithProduct[]> => {
    const data = await http.get(`/products/clinic-products/${clinicId}/low-stock`)
    return productClinicWithProductSchema.array().parse(data)
  },

  createClinicProduct: async (
    data: CreateProductClinic,
  ): Promise<ProductClinicWithProduct> => {
    const result = await http.post('/products/clinic-products', data)
    return productClinicWithProductSchema.parse(result)
  },

  updateClinicProduct: async (
    id: string,
    data: UpdateProductClinic,
  ): Promise<ProductClinicWithProduct> => {
    const result = await http.patch(`/products/clinic-products/${id}`, data)
    return productClinicWithProductSchema.parse(result)
  },

  restock: async (
    id: string,
    data: RestockProductClinic,
  ): Promise<ProductClinicWithProduct> => {
    const result = await http.patch(`/products/clinic-products/${id}/restock`, data)
    return productClinicWithProductSchema.parse(result)
  },

  deleteClinicProduct: async (id: string): Promise<void> => {
    await http.delete(`/products/clinic-products/${id}`)
  },
}