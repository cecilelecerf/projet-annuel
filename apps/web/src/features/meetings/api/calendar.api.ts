import { http } from '@/lib/api'
import {
  actSchema,
  animalMeetingActSchema,
  animalMeetingSchema,
  calendarSchema,
  internalMeetingSchema,
  meetingMetaSchema,
  meetingSchema,
  type Calendar,
  type CreateAnimalMeeting,
  type CreateInternalMeeting,
  type Meeting,
  type MeetingId,
  type MeetingMeta,
  type UserId,
} from '@armali/schemas'

export const calendarApi = {
  getCalendar: async (start: string, end: string, userId?: UserId): Promise<Calendar> => {
    const data = await http.get(
      `/meetings/calendar${userId ? '/' + userId : ''}?startDate=${start}&endDate=${end}`,
    )
    return calendarSchema.parse(data)
  },

  getMeetingsByDate: async (date: string, userId?: UserId): Promise<Meeting[]> => {
    const data = await http.get(
      `/meetings${userId ? '/' + userId : ''}?startDate=${date}&endDate=${date}`,
    )
    return meetingSchema.array().parse(data)
  },

  getMeeting: async (meetingId: string, date?: string): Promise<MeetingMeta> => {
    const data = await http.get(`/meetings/${meetingId}${date ? `?date=${date}` : ''}`)
    return meetingMetaSchema.parse(data)
  },

  getActs: async (meetingId: string): Promise<MeetingMeta> => {
    const data = await http.get(`/meetings/${meetingId}/acts`)
    return meetingMetaSchema.parse(data)
  },
  getPrescriptions: async (meetingId: string): Promise<MeetingMeta> => {
    const data = await http.get(`/meetings/${meetingId}/prescriptions`)
    return meetingMetaSchema.parse(data)
  },

  internal: {
    new: async (meeting: CreateInternalMeeting) => {
      const data = await http.post(`/meetings/internal`, meeting)
    },
    get: async (meetingId: MeetingId) => {
      const data = await http.get(`/meetings/internal/${meetingId}`)
      return internalMeetingSchema.parse(data)
    },
  },
  animal: {
    new: async (meeting: CreateAnimalMeeting) => {
      const data = await http.post(`/meetings/animal`, meeting)
    },
    get: async (meetingId: MeetingId) => {
      const data = await http.get(`/meetings/animal/${meetingId}`)
      return animalMeetingSchema.parse(data)
    },
  },
  meetingActs: {
    getAll: async (meetingId: MeetingId) => {
      const data = await http.get(`/meeting-acts/meeting/${meetingId}`)
      return animalMeetingActSchema.array().parse(data)
    },
  },
}
