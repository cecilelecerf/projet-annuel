import { http } from '@/lib/api'
import { specialitySchema, type Speciality, type CreateSpeciality } from '@armali/schemas'

export const specialitiesApi = {
  search: async (query: string): Promise<Speciality[]> => {
    const data = await http.get(`/specialities?search=${encodeURIComponent(query)}`)
    return specialitySchema.array().parse(data)
  },

  create: async (name: string, description: string): Promise<Speciality> => {
    const payload: CreateSpeciality = { name, description }
    const data = await http.post('/specialities', payload)
    return specialitySchema.parse(data)
  },

  getClinicSpecialities: async (): Promise<Speciality[]> => {
    const data = await http.get('/referent/clinic/specialities')
    return specialitySchema.array().parse(data)
  },

  updateClinicSpecialities: async (specialityIds: string[]): Promise<Speciality[]> => {
    const data = await http.patch('/referent/clinic/specialities', { specialityIds })
    return specialitySchema.array().parse(data)
  },
}