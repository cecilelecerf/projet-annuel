import { http } from '@/lib/api'
import {
  calendarSchema,
  meetingSchema,
  type Calendar,
  type Meeting,
  type UserId,
} from '@armali/schemas'

export const calendarApi = {
  getCalendar: async (start: string, end: string, userId?: UserId): Promise<Calendar> => {
    const data = await http.get(
      `/calendar${userId ? '/' + userId : ''}?startDate=${start}&endDate=${end}`,
    )
    return calendarSchema.parse(data)
  },

  getMeetingsByDate: async (date: string, userId?: UserId): Promise<Meeting[]> => {
    const data = await http.get(
      `/calendar${userId ? '/' + userId : ''}/meetings?startDate=${date}&endDate=${date}`,
    )
    return meetingSchema.array().parse(data)
  },

  newMeeting: async () => {
    const data = await http.post('/calendar/meeting')
  },
}
