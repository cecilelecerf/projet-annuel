import { http } from '@/lib/api'
import { specialitySchema, type Speciality } from '@armali/schemas'

export const specialityApi = {
  getAll: async (): Promise<Speciality[]> => {
    const data = await http.get('/specialities')
    return specialitySchema.array().parse(data)
  },

  getById: async (id: string): Promise<Speciality> => {
    const data = await http.get(`/specialities/${id}`)
    return specialitySchema.parse(data)
  },
}
