import { http } from '@/lib/api'
import type { Speciality, CreateSpeciality } from '@armali/schemas'

export const specialitiesApi = {
  search: (query: string) =>
    http.get<Speciality[]>(`/specialities?search=${encodeURIComponent(query)}`),

  create: (name: string, description: string) =>
    http.post<Speciality>('/specialities', { name, description } satisfies CreateSpeciality),

  getClinicSpecialities: () => http.get<Speciality[]>('/referent/clinic/specialities'),

  updateClinicSpecialities: (specialityIds: string[]) =>
    http.patch<Speciality[]>('/referent/clinic/specialities', { specialityIds }),
}