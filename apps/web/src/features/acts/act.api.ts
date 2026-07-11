import { http } from '@/lib/api'
import { actSchema, type Act, type ActType, type CreateAct, type UpdateAct } from '@armali/schemas'

export const actApi = {
  getAll: async (params?: { types?: ActType[] }): Promise<Act[]> => {
    const query = new URLSearchParams()
    params?.types?.forEach((type) => query.append('type', type))
    const queryString = query.toString()

    return http
      .get(`/acts${queryString ? `?${queryString}` : ''}`)
      .then((data) => actSchema.array().parse(data))
  },

  getById: (id: string): Promise<Act> =>
    http.get(`/acts/${id}`).then((data) => actSchema.parse(data)),

  create: (payload: CreateAct): Promise<Act> =>
    http.post('/acts', payload).then((data) => actSchema.parse(data)),

  update: ({ id, ...payload }: UpdateAct & { id: string }): Promise<Act> =>
    http.patch(`/acts/${id}`, payload).then((data) => actSchema.parse(data)),

  remove: ({ id }: { id: string }): Promise<void> => http.delete(`/acts/${id}`),
}
