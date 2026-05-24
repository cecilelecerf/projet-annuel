import { http } from '@/lib/api'
import {
  actSchema,
  animalMeetigWithMeetingSchema,
  animalMeetingActSchema,
  animalMeetingSchema,
  calendarSchema,
  internalMeetingSchema,
  meetingMetaSchema,
  meetingSchema,
  ownedPetWithRaceMeta,
  type Calendar,
  type ClientId,
  type CreateAnimalMeeting,
  type CreateInternalMeeting,
  type Meeting,
  type MeetingId,
  type MeetingMeta,
  type UpdateAnimalMeeting,
  type UserId,
} from '@armali/schemas'

export const calendarApi = {
  getCalendar: async (start: string, end: string, userId?: UserId): Promise<Calendar> => {
    const data = await http.get(
      `/meetings/calendar${userId ? '/' + userId : ''}?startDate=${start}&endDate=${end}`,
    )
    return calendarSchema.parse(data)
  },

  byDate: async (date: string, userId?: UserId): Promise<Meeting[]> => {
    const data = await http.get(
      `/meetings${userId ? '/' + userId : ''}?startDate=${date}&endDate=${date}`,
    )
    return meetingSchema.array().parse(data)
  },

  get: async (meetingId: string, date?: string): Promise<MeetingMeta> => {
    const data = await http.get(`/meetings/${meetingId}${date ? `?date=${date}` : ''}`)
    return meetingMetaSchema.parse(data)
  },

  delete: async (meetingId: MeetingId) => {
    return await http.delete(`/meetings/${meetingId}`)
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
      const data = await http.post(`/meetings/animals`, meeting)
    },
    get: async (meetingId: MeetingId) => {
      const data = await http.get(`/meetings/animals/${meetingId}`)
      return animalMeetingSchema.parse(data)
    },
    update: async (meetingId: MeetingId, meeting: UpdateAnimalMeeting) => {
      const data = await http.patch(`/meetings/animals/${meetingId}`, meeting)
      return animalMeetigWithMeetingSchema.parse(data)
    },

    getAllByClientId: async (clientId: ClientId) => {
      const data = await http.get(`/meetings/animals/users/${clientId}`)
      return animalMeetigWithMeetingSchema
        .extend({ ownedPet: ownedPetWithRaceMeta })
        .array()
        .parse(data)
    },
  },
}
