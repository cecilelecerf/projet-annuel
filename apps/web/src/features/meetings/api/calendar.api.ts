import { http } from '@/lib/api'
import {
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

  getMeeting: async (meetingId: string): Promise<Meeting> => {
    const data = await http.get(`/meetings/${meetingId}`)
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
}
