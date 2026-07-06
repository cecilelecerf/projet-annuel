import { http } from '@/lib/api'
import {
  orderWithItemsSchema,
  checkoutResultSchema,
  type OrderWithItems,
  type CheckoutResult,
  type Checkout,
} from '@armali/schemas'

export const ordersApi = {
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
}