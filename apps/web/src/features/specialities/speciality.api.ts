import { http } from '@/lib/api'
import { specialitySchema, type CreateSpeciality, type Speciality } from '@armali/schemas'

export const specialityApi = {
  getAll: async (): Promise<Speciality[]> => {
    const data = await http.get('/specialities')
    return specialitySchema.array().parse(data)
  },

  getById: async (id: string): Promise<Speciality> => {
    const data = await http.get(`/specialities/${id}`)
    return specialitySchema.parse(data)
  },

  search: async (query: string): Promise<Speciality[]> => {
    const data = await http.get(`/specialities?search=${encodeURIComponent(query)}`)
    return specialitySchema.array().parse(data)
  },

  create: async (name: string, description: string): Promise<Speciality> => {
    const payload: CreateSpeciality = { name, description }
    const data = await http.post('/specialities', payload)
    return specialitySchema.parse(data)
  },

  getSpecialitiesByClinic: async (): Promise<Speciality[]> => {
    const data = await http.get('/referent/clinic/specialities')
    return specialitySchema.array().parse(data)
  },

  updateClinicSpecialities: async (specialityIds: string[]): Promise<Speciality[]> => {
    const data = await http.patch('/referent/clinic/specialities', { specialityIds })
    return specialitySchema.array().parse(data)
  },
}
