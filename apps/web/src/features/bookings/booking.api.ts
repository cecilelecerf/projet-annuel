import { http } from '@/lib/api'

import {
  bookingClinicSchema,
  bookingConfirmationSchema,
  bookingSlotSchema,
  bookingVetSchema,
  createBookingSchema,
  type BookingSearchQuery,
  type ClinicId,
  type CreateBooking,
  type VeterinarianId,
} from '@armali/schemas'
import { z } from 'zod'

export const bookingApi = {
  // ── Recherche de cliniques ─────────────────────────────────────────────────
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

  // ── Créneaux disponibles pour un veto ──────────────────────────────────────
  getVetSlots: async ({
    veterinarianId,
    clinicId,
    date,
  }: {
    veterinarianId: VeterinarianId
    clinicId: ClinicId
    date: string
  }) => {
    const params = new URLSearchParams({ date, clinicId })
    const data = await http.get(`/booking/vets/${veterinarianId}/slots?${params}`)
    return bookingSlotSchema.array().parse(data)
  },

  // ── Créer le rendez-vous ───────────────────────────────────────────────────
  create: async (payload: CreateBooking) => {
    const validated = createBookingSchema.parse(payload)
    const data = await http.post('/booking', validated)
    return bookingConfirmationSchema.parse(data)
  },
}
