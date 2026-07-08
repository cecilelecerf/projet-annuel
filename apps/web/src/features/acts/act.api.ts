import { http } from '@/lib/api'
import { actSchema, type Act, type CreateAct, type UpdateAct } from '@armali/schemas'

export const actApi = {
  getAll: (): Promise<Act[]> => http.get('/acts').then((data) => actSchema.array().parse(data)),

  getById: (id: string): Promise<Act> =>
    http.get(`/acts/${id}`).then((data) => actSchema.parse(data)),

  create: (payload: CreateAct): Promise<Act> =>
    http.post('/acts', payload).then((data) => actSchema.parse(data)),

  update: ({ id, ...payload }: UpdateAct & { id: string }): Promise<Act> =>
    http.patch(`/acts/${id}`, payload).then((data) => actSchema.parse(data)),

  remove: ({ id }: { id: string }): Promise<void> => http.delete(`/acts/${id}`),
}
