import { http } from '@/lib/api'
import {
  orderWithItemsSchema,
  orderWithClientSchema,
  checkoutResultSchema,
  type OrderWithItems,
  type OrderWithClient,
  type CheckoutResult,
  type Checkout,
  type DeliverOrder,
} from '@armali/schemas'

export const ordersApi = {
  // ── Client ────────────────────────────────────────────────────────────────
  checkout: async (payload: Checkout): Promise<CheckoutResult> => {
    const data = await http.post('/orders/checkout', payload)
    return checkoutResultSchema.parse(data)
  },

  getMine: async (): Promise<OrderWithItems[]> => {
    const data = await http.get('/orders/mine')
    return orderWithItemsSchema.array().parse(data)
  },

  getById: async (id: string): Promise<OrderWithItems> => {
    const data = await http.get(`/orders/${id}`)
    return orderWithItemsSchema.parse(data)
  },

  // ── Secrétaire ────────────────────────────────────────────────────────────
  getClinicOrders: async (): Promise<OrderWithClient[]> => {
    const data = await http.get('/orders/clinic/pending')
    return orderWithClientSchema.array().parse(data)
  },

  markReady: async (id: string): Promise<void> => {
    await http.patch(`/orders/${id}/ready`, {})
  },

  deliver: async (payload: DeliverOrder): Promise<OrderWithClient> => {
    const data = await http.post('/orders/deliver', payload)
    return orderWithClientSchema.parse(data)
  },
}