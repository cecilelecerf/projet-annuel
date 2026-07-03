import { http } from '@/lib/api'
import {
  clinicActSchema,
  medicalHistorySchema,
  type ClinicId,
  type MedicalHistoryId,
  type MeetingId,
  type UpdateMedicalHistory,
} from '@armali/schemas'

export const medicalHistoriesApi = {
  getByClinic: async (clinicId: ClinicId) => {
    const data = await http.get(`/acts/clinic/${clinicId}`)
    return clinicActSchema.array().parse(data)
  },
  getByMeeting: async (meetingId: MeetingId) => {
    const data = await http.get(`/meetings/animals/${meetingId}/medical-histories`)
    return medicalHistorySchema.array().parse(data)
  },
  update: async (
    meetingId: MeetingId,
    meetingActId: MedicalHistoryId,
    body: UpdateMedicalHistory,
  ) => {
    const data = await http.patch(`/medical-histories/${meetingId}/${meetingActId}`, body)
    return medicalHistorySchema.parse(data)
  },
  get: async (meetingId: MeetingId, meetingActId: MedicalHistoryId) => {
    const data = await http.get(`/medical-histories/${meetingId}/${meetingActId}`)
    return medicalHistorySchema.parse(data)
  },
  create: async (meetingId: MeetingId, body: UpdateMedicalHistory) => {
    const data = await http.post(`/medical-histories/${meetingId}`, body)
    return medicalHistorySchema.parse(data)
  },
}
