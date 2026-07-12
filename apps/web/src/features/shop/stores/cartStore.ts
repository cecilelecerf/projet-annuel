import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type { ProductClinicWithClinic } from '@armali/schemas'

const STORAGE_KEY = 'armali_cart'

export interface CartItem {
  clinicProductId: string
  productName: string
  brandName: string
  clinicId: string
  clinicName: string
  price: number
  picture?: string | null
  quantity: number
  maxStock: number
}

function loadFromStorage(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export const useCartStore = defineStore('cart', () => {
  const items = ref<CartItem[]>(loadFromStorage())

  // Persistance automatique à chaque changement
  watch(
    items,
    (value) => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
    },
    { deep: true },
  )

  const totalItems = computed(() => items.value.reduce((sum, i) => sum + i.quantity, 0))
  const totalPrice = computed(() =>
    Math.round(items.value.reduce((sum, i) => sum + i.price * i.quantity, 0) * 100) / 100,
  )

  // Regroupement par clinique : utile car une commande (Order) ne concerne qu'une seule clinique
  const groupedByClinic = computed(() => {
    const groups = new Map<string, { clinicId: string; clinicName: string; items: CartItem[] }>()
    for (const item of items.value) {
      if (!groups.has(item.clinicId)) {
        groups.set(item.clinicId, { clinicId: item.clinicId, clinicName: item.clinicName, items: [] })
      }
      groups.get(item.clinicId)!.items.push(item)
    }
    return [...groups.values()]
  })

  function addItem(product: ProductClinicWithClinic, quantity: number) {
    const existing = items.value.find((i) => i.clinicProductId === product.id)
    if (existing) {
      existing.quantity = Math.min(existing.quantity + quantity, existing.maxStock)
      return
    }
    items.value.push({
      clinicProductId: product.id,
      productName: product.product.name,
      brandName: product.product.brand.name,
      clinicId: product.clinic.id,
      clinicName: product.clinic.name,
      price: product.price,
      picture: product.product.picture,
      quantity: Math.min(quantity, product.stock),
      maxStock: product.stock,
    })
  }

  function updateQuantity(clinicProductId: string, quantity: number) {
    const item = items.value.find((i) => i.clinicProductId === clinicProductId)
    if (!item) return
    item.quantity = Math.max(1, Math.min(quantity, item.maxStock))
  }

  function removeItem(clinicProductId: string) {
    items.value = items.value.filter((i) => i.clinicProductId !== clinicProductId)
  }

  function clear() {
    items.value = []
  }

  return {
    items,
    totalItems,
    totalPrice,
    groupedByClinic,
    addItem,
    updateQuantity,
    removeItem,
    clear,
  }
})