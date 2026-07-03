import { http } from '@/lib/api'

// ─────────────────────────────────────────────────────────────────────────
// Types 
// ─────────────────────────────────────────────────────────────────────────

export interface Brand {
  id: string
  name: string
  logo?: string | null
}

export interface Product {
  id: string
  name: string
  description?: string | null
  qrCode: string
  websiteUrl?: string | null
  picture?: string | null
  brandId: string
  brand: Brand
}

export interface ClinicProduct {
  id: string
  clinicId: string
  productId: string
  stock: number
  minimumRequired: number
  price: number
  product: Product
}

export interface CreateProductPayload {
  name: string
  description?: string
  qrCode?: string
  websiteUrl?: string
  picture?: string
  brandId: string
}

export interface CreateClinicProductPayload {
  clinicId: string
  productId: string
  stock: number
  minimumRequired: number
  price: number
}

export interface UpdateClinicProductPayload {
  minimumRequired?: number
  price?: number
}

export interface RestockPayload {
  quantity: number
}

// ─────────────────────────────────────────────────────────────────────────
// Appels API
// ─────────────────────────────────────────────────────────────────────────

export interface UpdateProductPayload {
  name?: string
  description?: string
  brandId?: string
}

export const productsApi = {
  // Catalogue global
  getAll: () => http.get<Product[]>('/products'),
  create: (data: CreateProductPayload) => http.post<Product>('/products', data),
  update: (id: string, data: UpdateProductPayload) =>
    http.patch<Product>(`/products/${id}`, data),

  // Stock par clinique
  getClinicProducts: (clinicId: string) =>
    http.get<ClinicProduct[]>(`/products/clinic-products/${clinicId}`),

  createClinicProduct: (data: CreateClinicProductPayload) =>
    http.post<ClinicProduct>('/products/clinic-products', data),

  updateClinicProduct: (id: string, data: UpdateClinicProductPayload) =>
    http.patch<ClinicProduct>(`/products/clinic-products/${id}`, data),

  restock: (id: string, data: RestockPayload) =>
    http.patch<ClinicProduct>(`/products/clinic-products/${id}/restock`, data),

  deleteClinicProduct: (id: string) =>
    http.delete<void>(`/products/clinic-products/${id}`),
}