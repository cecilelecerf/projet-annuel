import { http } from '@/lib/api'
import type {
  ProductWithBrand,
  ProductClinicWithProduct,
  CreateProduct,
  UpdateProduct,
  CreateProductClinic,
  UpdateProductClinic,
  RestockProductClinic,
} from '@armali/schemas'

// ─────────────────────────────────────────────────────────────────────────
// Appels API
// ─────────────────────────────────────────────────────────────────────────

export const productsApi = {
  // Catalogue global
  getAll: () => http.get<ProductWithBrand[]>('/products'),
  create: (data: CreateProduct) => http.post<ProductWithBrand>('/products', data),
  update: (id: string, data: UpdateProduct) =>
    http.patch<ProductWithBrand>(`/products/${id}`, data),

  // Stock par clinique
  getClinicProducts: (clinicId: string) =>
    http.get<ProductClinicWithProduct[]>(`/products/clinic-products/${clinicId}`),

  createClinicProduct: (data: CreateProductClinic) =>
    http.post<ProductClinicWithProduct>('/products/clinic-products', data),

  updateClinicProduct: (id: string, data: UpdateProductClinic) =>
    http.patch<ProductClinicWithProduct>(`/products/clinic-products/${id}`, data),

  restock: (id: string, data: RestockProductClinic) =>
    http.patch<ProductClinicWithProduct>(`/products/clinic-products/${id}/restock`, data),

  deleteClinicProduct: (id: string) =>
    http.delete<void>(`/products/clinic-products/${id}`),
}