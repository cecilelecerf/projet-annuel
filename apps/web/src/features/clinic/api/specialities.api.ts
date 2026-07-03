import { http } from '@/lib/api'

export interface Speciality {
  id: string
  name: string
  description: string
}

export const specialitiesApi = {
  search: (query: string) =>
    http.get<Speciality[]>(`/specialities?search=${encodeURIComponent(query)}`),

  create: (name: string, description: string) =>
    http.post<Speciality>('/specialities', { name, description }),

  getClinicSpecialities: () => http.get<Speciality[]>('/referent/clinic/specialities'),

  updateClinicSpecialities: (specialityIds: string[]) =>
    http.patch<Speciality[]>('/referent/clinic/specialities', { specialityIds }),
}