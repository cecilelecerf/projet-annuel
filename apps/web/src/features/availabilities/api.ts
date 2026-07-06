import { http } from '@/lib/api'
import {
  type AvailabilityId,
  availabilityResponseSchema,
  type CreateAvailability,
  type UpdateAvailability,
} from '@armali/schemas'

export const availabilitiesApi = {
  create: async ({ payload }: { payload: CreateAvailability }) => {
    await http.post(`/meetings/availabilities`, payload)
  },
  update: async ({ id, payload }: { id: AvailabilityId; payload: UpdateAvailability }) => {
    await http.patch(`/meetings/availabilities/${id}`, payload)
  },
  delete: async ({ id }: { id: AvailabilityId }) => {
    await http.delete(`/meetings/availabilities/${id}`)
  },
  getAll: async ({ date }: { date?: string }) => {
    const url = date ? `/meetings/availabilities?date=${date}` : `/meetings/availabilities`
    return await http.get(url).then((data) => availabilityResponseSchema.array().parse(data))
  },
}
