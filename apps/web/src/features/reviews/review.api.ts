import { http } from '@/lib/api'
import {
  reviewMetaSchema,
  reviewSchema,
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
      .then((data) => reviewSchema.nullable().parse(data))
  },

  upsert: async ({ payload }: { payload: CreateReview }) => {
    return http.post(`/reviews`, payload).then((data) => reviewSchema.parse(data))
  },

  getAll: async () => {
    return http.get(`/reviews`).then((data) => reviewMetaSchema.array().parse(data))
  },
  // TODO A faire + ajouter le slider dans la vue veterinarian
  // TODO Wrapper le composant slider dans un composant container avec en + le nombre de vote donnée et la moyenne
  // getByVeto: async ({
  //   veterinarianClinicId,
  // }: {
  //   veterinarianClinicId: VeterinarianClinicId
  // }) => {
  //   return http
  //     .get(`/veterinarian-clinics/${veterinarianClinicId}/review/me`)
  //     .then((data) => reviewSchema.nullable().parse(data))
  // },
}
