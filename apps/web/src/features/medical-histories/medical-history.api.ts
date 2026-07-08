import { http } from '@/lib/api'
import {
  clinicActSchema,
  medicalHistoryMetaSchema,
  medicalHistorySchema,
  type AnimalId,
  type ClinicId,
  type CreateMedicalHistory,
  type MedicalHistoryId,
  type MeetingId,
  type UpdateMedicalHistory,
} from '@armali/schemas'

export const medicalHistoriesApi = {
  getAll: async () => {
    const data = await http.get(`/medical-histories`)
    return clinicActSchema.array().parse(data)
  },
  getByClinic: async (clinicId: ClinicId) => {
    const data = await http.get(`/clinics/${clinicId}/medical-histories`)
    return clinicActSchema.array().parse(data)
  },
  getByMeeting: async (meetingId: MeetingId) => {
    const data = await http.get(`/meetings/animals/${meetingId}/medical-histories`)
    return medicalHistoryMetaSchema.array().parse(data)
  },
  getByAnimal: async (animalId: AnimalId) => {
    const data = await http.get(`/animals/${animalId}/medical-histories`)
    return medicalHistoryMetaSchema.array().parse(data)
  },
  update: async ({
    medicalHistoryId,
    body,
  }: {
    medicalHistoryId: MedicalHistoryId
    body: UpdateMedicalHistory
  }) => {
    const data = await http.patch(`/medical-histories/${medicalHistoryId}`, body)
    return medicalHistorySchema.parse(data)
  },
  get: async (meetingId: MeetingId, meetingActId: MedicalHistoryId) => {
    const data = await http.get(`/medical-histories/${meetingId}/${meetingActId}`)
    return medicalHistorySchema.parse(data)
  },
  create: async ({ body }: { body: CreateMedicalHistory }) => {
    const data = await http.post(`/medical-histories`, body)
    return medicalHistorySchema.parse(data)
  },
  delete: async (medicalHistoryId: MedicalHistoryId) => {
    await http.delete(`/medical-histories/${medicalHistoryId}`)
  },
}
