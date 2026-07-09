import { http } from '@/lib/api'
import {
  clinicActSchema,
  type ActId,
  type ClinicAct,
  type ClinicId,
  type CreateClinicAct,
  type UpdateClinicAct,
} from '@armali/schemas'

export const clinicActApi = {
  getByClinic: (clinicId: ClinicId): Promise<ClinicAct[]> =>
    http.get(`/clinics/${clinicId}/acts`).then((data) => clinicActSchema.array().parse(data)),

  getById: (id: ActId, clinicId: ClinicId): Promise<ClinicAct> =>
    http.get(`/clinics/${clinicId}/acts/${id}`).then((data) => clinicActSchema.parse(data)),

  create: (payload: CreateClinicAct, clinicId: ClinicId): Promise<ClinicAct> =>
    http.post(`/clinics/${clinicId}/acts`, payload).then((data) => clinicActSchema.parse(data)),

  update: ({
    id,
    clinicId,
    ...payload
  }: UpdateClinicAct & { id: ActId; clinicId: ClinicId }): Promise<ClinicAct> =>
    http
      .patch(`/clinics/${clinicId}/acts/${id}`, payload)
      .then((data) => clinicActSchema.parse(data)),

  remove: ({ id, clinicId }: { id: ActId; clinicId: ClinicId }): Promise<void> =>
    http.delete(`/clinics/${clinicId}/acts/${id}`),
}
