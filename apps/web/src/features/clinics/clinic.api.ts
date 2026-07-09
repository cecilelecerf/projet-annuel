import { http } from '@/lib/api'
import {
  baseUserSchema,
  clientProfileSchema,
  clinicGuardRequest,
  clinicSchema,
  clinicStatusSchema,
  specialitySchema,
  type ClinicId,
  type ClinicRequestId,
  type CreateClinicRequest,
  type Speciality,
  type SpecialityId,
  type UpdateClinic,
} from '@armali/schemas'

export const clinicApi = {
  getMine: async () => {
    return await http.get('/clinics/me').then((data) => clinicSchema.array().parse(data))
  },

  getClients: async ({ clinicId }: { clinicId: ClinicId }) => {
    return await http
      .get(`/clinics/${clinicId}/clients`)
      .then((data) => clientProfileSchema.extend({ user: baseUserSchema }).array().parse(data))
  },

  update: async ({ payload }: { payload: UpdateClinic }) => {
    return await http.patch('/clinics', payload).then((data) => clinicSchema.parse(data))
  },

  // Director and admin
  remove: async ({ id }: { id: ClinicId }) => {
    await http.delete(`/clinics/${id}`)
  },

  // Admin
  getAll: async () => {
    return await http.get('/clinics').then((data) => clinicSchema.array().parse(data))
  },

  request: {
    // Director status
    status: async () => {
      return await http
        .get('/clinics/requests/status')
        .then((data) => clinicGuardRequest.parse(data))
    },
    create: async ({ payload }: { payload: CreateClinicRequest }) => {
      return await http.post('/clinics/requests', payload).then()
    },

    getAll: async () => {
      return await http
        .get('/clinics/requests')
        .then((data) => clinicSchema.extend({ status: clinicStatusSchema }).array().parse(data))
    },
    approve: async ({ id }: { id: ClinicRequestId }) => {
      return await http.get(`/clinics/requests/${id}/approve`)
    },
    reject: async ({ id }: { id: ClinicRequestId }) => {
      return await http.get(`/clinics/requests/${id}/reject`)
    },
  },

  specialities: {
    getAcceptedSpecialities: async ({
      clinicId,
    }: {
      clinicId: ClinicId
    }): Promise<Speciality[]> => {
      const data = await http.get(`/clinics/${clinicId}/specialities`)
      return specialitySchema.array().parse(data)
    },

    setAcceptedSpecialities: async ({
      clinicId,
      specialityIds,
    }: {
      specialityIds: SpecialityId[]
      clinicId: ClinicId
    }): Promise<Speciality[]> => {
      const data = await http.patch(`/clinics/${clinicId}/specialities`, { specialityIds })
      return specialitySchema.array().parse(data)
    },
  },
}
