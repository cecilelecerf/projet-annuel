import { http } from '@/lib/api'
import {
  medicalHistorySchema,
  type CreateMedicalHistory,
  type MedicalHistoryId,
  type MeetingId,
  type UpdateMedicalHistory,
} from '@armali/schemas'

export const medicalHistoriesApi = {
  getAll: async (meetingId: MeetingId) => {
    const data = await http.get(`/medical-histories/meeting/${meetingId}`)
    return medicalHistorySchema.array().parse(data)
  },
  get: async (actId: MedicalHistoryId) => {
    const data = await http.get(`/medical-histories/${actId}`)
    return medicalHistorySchema.parse(data)
  },
  create: async (body: CreateMedicalHistory) => {
    const data = await http.post(`/medical-histories`, body)
    return medicalHistorySchema.parse(data)
  },
  update: async (actId: MedicalHistoryId, body: UpdateMedicalHistory) => {
    const data = await http.patch(`/medical-histories/${actId}`, body)
    return medicalHistorySchema.parse(data)
  },
}
