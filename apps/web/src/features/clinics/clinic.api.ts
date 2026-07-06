import { http } from '@/lib/api'
import {
  baseUserSchema,
  clientProfileSchema,
  clinicGuardRequest,
  clinicSchema,
  staffMemberSchema,
  type ClinicId,
  type UpdateClinic,
  type UserRole,
} from '@armali/schemas'

export const clinicApi = {
  getMine: async () => {
    return await http.get('/clinics/me').then((data) => clinicSchema.array().parse(data))
  },

  staffByClinic: async ({ roles, clinicId }: { roles?: UserRole[]; clinicId: ClinicId }) => {
    const params = new URLSearchParams()
    if (roles) roles.forEach((role) => params.append('roles', role))

    return await http
      .get(`/clinics/${clinicId}/staffs?${params}`)
      .then((data) => staffMemberSchema.array().parse(data))
  },

  getClients: async ({ clinicId }: { clinicId: ClinicId }) => {
    return await http
      .get(`/clinics/${clinicId}/clients`)
      .then((data) => clientProfileSchema.extend({ user: baseUserSchema }).array().parse(data))
  },

  update: async ({ payload }: { payload: UpdateClinic }) => {
    return await http.patch('/clinics', payload).then((data) => clinicSchema.parse(data))
  },
  guard: async () => {
    return await http.get('/director/clinic').then((data) => clinicGuardRequest.parse(data))
  },
}
