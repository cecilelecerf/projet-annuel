import { http } from '@/lib/api'
import {
  medicalHistorySchema,
  type AnimalMeetingActId,
  type MeetingId,
  type UpdateMedicalHistory,
} from '@armali/schemas'

export const medicalHistoriesApi = {
  getAll: async (meetingId: MeetingId) => {
    const data = await http.get(`/medical-histories/${meetingId}`)
    return medicalHistorySchema.array().parse(data)
  },
  update: async (
    meetingId: MeetingId,
    meetingActId: AnimalMeetingActId,
    body: UpdateMedicalHistory,
  ) => {
    const data = await http.patch(`/medical-histories/${meetingId}/${meetingActId}`, body)
    return medicalHistorySchema.parse(data)
  },
  get: async (meetingId: MeetingId, meetingActId: AnimalMeetingActId) => {
    const data = await http.get(`/medical-histories/${meetingId}/${meetingActId}`)
    return medicalHistorySchema.parse(data)
  },
  create: async (meetingId: MeetingId, body: UpdateMedicalHistory) => {
    const data = await http.post(`/medical-histories/${meetingId}`, body)
    return medicalHistorySchema.parse(data)
  },
}
