import { http } from '@/lib/api'
import {
  animalMeetingActSchema,
  clinicActSchema,
  type AnimalMeetingActId,
  type ClinicId,
  type MeetingId,
  type UpdateAnimalMeetingAct,
} from '@armali/schemas'

export const actsApi = {
  clinicActs: {
    getByClinic: async (clinicId: ClinicId) => {
      const data = await http.get(`/acts/clinic/${clinicId}`)
      return clinicActSchema.array().parse(data)
    },
  },
  meetingActs: {
    getAll: async (meetingId: MeetingId) => {
      const data = await http.get(`/acts/meeting/${meetingId}`)
      return animalMeetingActSchema.array().parse(data)
    },
    update: async (
      meetingId: MeetingId,
      meetingActId: AnimalMeetingActId,
      body: UpdateAnimalMeetingAct,
    ) => {
      const data = await http.patch(`/acts/meeting/${meetingId}/${meetingActId}`, body)
      return animalMeetingActSchema.parse(data)
    },
    get: async (meetingId: MeetingId, meetingActId: AnimalMeetingActId) => {
      const data = await http.get(`/acts/meeting/${meetingId}/${meetingActId}`)
      return animalMeetingActSchema.parse(data)
    },
    create: async (meetingId: MeetingId, body: UpdateAnimalMeetingAct) => {
      const data = await http.post(`/acts/meeting/${meetingId}`, body)
      return animalMeetingActSchema.parse(data)
    },
  },
}
