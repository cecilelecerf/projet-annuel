import { http } from '@/lib/api'
import type { CreateVaccine, UpdateVaccine, Vaccine } from '@armali/schemas'

export const vaccineApi = {
  getAll: (): Promise<Vaccine[]> => http.get('/vaccines'),

  getById: (id: string): Promise<Vaccine> => http.get(`/vaccines/${id}`),

  create: (payload: CreateVaccine): Promise<Vaccine> => http.post('/vaccines', payload),

  update: ({ id, ...payload }: UpdateVaccine & { id: string }): Promise<Vaccine> =>
    http.patch(`/vaccines/${id}`, payload),

  remove: ({ id }: { id: string }): Promise<void> => http.delete(`/vaccines/${id}`),
}
