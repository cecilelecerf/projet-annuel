import { http } from '@/lib/api'
import {
  reviewMetaSchema,
  reviewSchema,
  reviewStatSchema,
  type CreateReview,
  type VeterinarianClinicId,
} from '@armali/schemas'

export const reviewApi = {
  getByVetoAndClient: async ({
    veterinarianClinicId,
  }: {
    veterinarianClinicId: VeterinarianClinicId
  }) => {
    return http
      .get(`/veterinarian-clinics/${veterinarianClinicId}/review/me`)
      .then((data) => reviewMetaSchema.nullable().parse(data))
  },

  upsert: async ({ payload }: { payload: CreateReview }) => {
    return http.post(`/reviews`, payload).then((data) => reviewSchema.parse(data))
  },

  getAll: async () => {
    return http.get(`/reviews`).then((data) => reviewMetaSchema.array().parse(data))
  },
  getStat: async () => {
    return http.get(`/reviews/stats`).then((data) => reviewStatSchema.parse(data))
  },

  getByVeto: async ({ veterinarianClinicId }: { veterinarianClinicId: VeterinarianClinicId }) => {
    return http
      .get(`/veterinarian-clinics/${veterinarianClinicId}/review`)
      .then((data) => reviewSchema.nullable().parse(data))
  },
}
