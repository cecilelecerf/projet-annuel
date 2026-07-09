import { http } from '@/lib/api'
import {
  animalMeetigWithMeetingSchema,
  animalMeetingSchema,
  calendarSchema,
  internalMeetingSchema,
  meetingBaseSchema,
  meetingMetaSchema,
  meetingSchema,
  type Calendar,
  type ClientId,
  type CreateAnimalMeeting,
  type CreateInternalMeeting,
  type Meeting,
  type MeetingId,
  type MeetingMeta,
  type AnimalId,
  type UpdateAnimalMeeting,
  type UserId,
  meetingRecurringSchema,
  type MeetingRecurringId,
  type UpdateRecurring,
  type UpdateInternalMeeting,
  internalMeetingField,
  type UpdateParticipantStatus,
  type VeterinarianId,
  type ClinicId,
  bookingSlotSchema,
  type BookingSearchQuery,
  bookingClinicSchema,
  bookingVetSchema,
  type CreateBooking,
  createBookingSchema,
  bookingConfirmationSchema,
  type AvailabilityTimeline,
  availabilityTimelineSchema,
} from '@armali/schemas'
import dayjs from 'dayjs'

export const meetingApi = {
  getCalendar: async ({
    start,
    end,
    userId,
  }: {
    start: string
    end: string
    userId?: UserId
  }): Promise<Calendar> => {
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

  getVetSlot: async ({
    veterinarianId,
    date,
    clinicId,
  }: {
    veterinarianId: VeterinarianId
    clinicId: ClinicId
    date: string
  }) => {
    const params = new URLSearchParams({ date, clinicId })

    return await http
      .get(`/meetings/veterinarians/${veterinarianId}/slots?${params}`)
      .then((d) => bookingSlotSchema.array().parse(d))
  },

  internal: {
    new: async (meeting: CreateInternalMeeting) => {
      await http.post(`/meetings/internal`, meeting)
    },
    get: async (meetingId: MeetingId) => {
      const data = await http.get(`/meetings/internal/${meetingId}`)
      return internalMeetingSchema.parse(data)
    },

    update: async ({
      meeting,
      meetingId,
      scope,
      date,
    }: {
      meetingId: MeetingId
      meeting: UpdateInternalMeeting
      scope: 'single' | 'all'
      date?: string
    }) => {
      const params = new URLSearchParams({ scope, ...(date && { date }) })
      const data = await http.patch(`/meetings/internal/${meetingId}?${params}`, meeting)
      return internalMeetingField
        .extend({
          meeting: meetingBaseSchema.nullable(),
          recurring: meetingRecurringSchema.nullable(),
        })
        .parse(data)
    },
    participantUpdate: async (meetingId: MeetingId, data: UpdateParticipantStatus) => {
      await http.patch(`/meetings/internal/${meetingId}/participants`, data)
    },
    delete: async ({
      meetingId,
      scope,
      date,
    }: {
      meetingId: MeetingId
      scope: 'single' | 'all'
      date?: string
    }) => {
      const params = new URLSearchParams({ scope, ...(date && { date }) })

      return await http.delete(`/meetings/internal/${meetingId}?${params}`)
    },
  },
  animal: {
    new: async (meeting: CreateAnimalMeeting) => {
      await http.post(`/meetings/animals`, meeting)
    },
    get: async (meetingId: MeetingId) => {
      const data = await http.get(`/meetings/animals/${meetingId}`)
      return animalMeetingSchema.parse(data)
    },
    update: async (meetingId: MeetingId, meeting: UpdateAnimalMeeting) => {
      const data = await http.patch(`/meetings/animals/${meetingId}`, meeting)
      return animalMeetigWithMeetingSchema.parse(data)
    },
    delete: async ({ meetingId }: { meetingId: MeetingId }) => {
      return await http.delete(`/meetings/animals/${meetingId}`)
    },
    getAllByAnimal: async (animalId: AnimalId) => {
      const data = await http.get(`/animals/${animalId}/animal-meetings`)
      return animalMeetigWithMeetingSchema.array().parse(data)
    },

    getAllByClientId: async (clientId: ClientId) => {
      const data = await http.get(`/users/${clientId}/animal-meetings`)
      return animalMeetigWithMeetingSchema.array().parse(data)
    },
    booking: {
      searchClinics: async (query: BookingSearchQuery) => {
        const params = new URLSearchParams()
        if (query.lat) params.set('lat', String(query.lat))
        if (query.lng) params.set('lng', String(query.lng))
        if (query.address) params.set('address', query.address)
        if (query.radiusKm) params.set('radiusKm', String(query.radiusKm))
        if (query.date) params.set('date', query.date)
        if (query.specialityId) params.set('specialityId', query.specialityId)
        if (query.petId) params.set('petId', query.petId)

        const data = await http.get(`/booking/clinics?${params}`)
        return bookingClinicSchema.array().parse(data)
      },

      // ── Vétérinaires d'une clinique ────────────────────────────────────────────
      getClinicVets: async ({
        clinicId,
        date,
        specialityId,
        petId,
      }: {
        clinicId: ClinicId
        date?: string
        specialityId?: string
        petId?: string
      }) => {
        const params = new URLSearchParams()
        if (date) params.set('date', date)
        if (specialityId) params.set('specialityId', specialityId)
        if (petId) params.set('petId', petId)

        const data = await http.get(`/booking/clinics/${clinicId}/vets?${params}`)
        return bookingVetSchema.array().parse(data)
      },

      // ── Créer le rendez-vous ───────────────────────────────────────────────────
      create: async (payload: CreateBooking) => {
        const validated = createBookingSchema.parse(payload)
        const data = await http.post('/booking', validated)
        return bookingConfirmationSchema.parse(data)
      },
    },
  },
  recurring: {
    get: async (reccuringId: MeetingRecurringId) => {
      const data = await http.get(`/meetings/recurrings/${reccuringId}`)
      return meetingRecurringSchema.parse(data)
    },
    update: async (reccuringId: MeetingRecurringId, body: UpdateRecurring) => {
      const data = await http.patch(`/meetings/recurrings/${reccuringId}`, body)
      return meetingRecurringSchema.parse(data)
    },
  },
  availability: {
    getTimeline: async ({
      veterinarianId,
      clinicId,
      date,
    }: {
      veterinarianId: VeterinarianId
      clinicId: ClinicId
      date: Date
    }): Promise<AvailabilityTimeline> => {
      const data = await http.get(
        `/veterinarians/${veterinarianId}/availabilities/timeline?date=${dayjs(date).format('YYYY-MM-DD')}&clinicId=${clinicId}`,
      )
      return availabilityTimelineSchema.parse(data)
    },
  },
}
