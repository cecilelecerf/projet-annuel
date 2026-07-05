import { http } from '@/lib/api'
import { clinicSchema, staffSchema, type ClinicId, type UserRole } from '@armali/schemas'

export const clinicApi = {
  getMine: async () => {
    return await http.get('/clinics/me').then((data) => clinicSchema.array().parse(data))
  },

  staffByClinic: async ({ roles, clinicId }: { roles?: UserRole[]; clinicId: ClinicId }) => {
    const params = new URLSearchParams()
    if (roles) roles.forEach((role) => params.append('roles', role))

    return await http
      .get(`/clinics/${clinicId}/staff?${params}`)
      .then((data) => staffSchema.array().parse(data))
  },
  getClients: async ({ clinicId }: { clinicId: ClinicId }) => {
    return await http
      .get(`/clinics/${clinicId}/clients`)
      .then((data) => staffSchema.array().parse(data))
  },
}
