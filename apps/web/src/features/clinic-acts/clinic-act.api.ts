import { http } from '@/lib/api'
import {
  clinicActSchema,
  type ClinicAct,
  type ClinicId,
  type CreateClinicAct,
  type UpdateClinicAct,
} from '@armali/schemas'

export const clinicActApi = {
  getByClinic: (clinicId: ClinicId): Promise<ClinicAct[]> =>
    http
      .get(`/clinics/${clinicId}/clinic-acts`)
      .then((data) => clinicActSchema.array().parse(data)),

  getById: (id: string): Promise<ClinicAct> =>
    http.get(`/clinic-acts/${id}`).then((data) => clinicActSchema.parse(data)),

  create: (payload: CreateClinicAct): Promise<ClinicAct> =>
    http.post('/clinic-acts', payload).then((data) => clinicActSchema.parse(data)),

  update: ({ id, ...payload }: UpdateClinicAct & { id: string }): Promise<ClinicAct> =>
    http.patch(`/clinic-acts/${id}`, payload).then((data) => clinicActSchema.parse(data)),

  remove: ({ id }: { id: string }): Promise<void> => http.delete(`/clinic-acts/${id}`),
}
