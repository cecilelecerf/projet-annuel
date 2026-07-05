import { http } from '@/lib/api'
import {
  animalMeetigWithMeetingSchema,
  animalMeetingFieldSchema,
  animalMeetingSchema,
  calendarSchema,
  internalMeetingSchema,
  meetingBaseSchema,
  meetingMetaSchema,
  meetingSchema,
  animalWithRaceMeta,
  type Calendar,
  type ClientId,
  type CreateAnimalMeeting,
  type CreateAvailability,
  type CreateInternalMeeting,
  type Meeting,
  type MeetingId,
  type MeetingMeta,
  type AnimalId,
  type UpdateAnimalMeeting,
  type UpdateInternalMeeting,
  type UserId,
  medicalHistorySchema,
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
    update: async (meetingId: MeetingId, meeting: UpdateInternalMeeting) => {
      const data = await http.patch(`/meetings/internal/${meetingId}`, meeting)
      return internalMeetingSchema.parse(data)
    },
  },
  availability: {
    new: async (availability: CreateAvailability) => {
      await http.post(`/meetings/availabilities`, availability)
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

    getAllByAnimal: async (animalId: AnimalId) => {
      const data = await http.get(`/meetings/animals/animals/${animalId}`)
      return animalMeetingFieldSchema
        .extend({
          meeting: meetingBaseSchema,
          animalMedicalHistories: medicalHistorySchema.array(),
        })
        .array()
        .parse(data)
    },

    getAllByClientId: async (clientId: ClientId) => {
      const data = await http.get(`/meetings/animals/users/${clientId}`)
      return animalMeetigWithMeetingSchema
        .extend({ animal: animalWithRaceMeta })
        .array()
        .parse(data)
    },
  },
}
