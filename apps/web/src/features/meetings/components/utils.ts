import type { Calendar, FlatMeeting } from '@armali/schemas'
import { match } from 'ts-pattern'

export const toCalendarEvent = (base: FlatMeeting) => {
  const date = base.date

  const start =
    date && base.startTime
      ? new Date(
          `${date.toISOString().split('T')[0]}T${base.startTime.toISOString().split('T')[1]}`,
        )
      : date

  const end =
    date && base.endTime
      ? new Date(`${date.toISOString().split('T')[0]}T${base.endTime.toISOString().split('T')[1]}`)
      : undefined
  const resultBase = {
    id: `${base.id}_${date.toISOString()}`,
    start: start?.toISOString(),
    end: end?.toISOString(),
  }
  return match(base)
    .with({ kind: 'ANIMAL' }, (b) => ({
      ...resultBase,
      title: b.speciality?.name ?? 'Consultation',
      extendedProps: {
        kind: base.kind,
        description: b.animalId,
        date: undefined,
      },
    }))
    .with({ kind: 'INTERNAL' }, (b) => ({
      ...resultBase,
      title: b.title,
      extendedProps: {
        kind: base.kind,
        description: b.clinicId,
        status: b.status,

        date: b.recurringId ? b.date : undefined,
      },
    }))
    .otherwise((b) => ({ ...resultBase, title: 'RDV', date: b.recurringId ? b.date : undefined }))
}

type BusinessHour = {
  daysOfWeek: number[]
  startTime: string
  endTime: string
}

function toTimeString(date: Date): string {
  return date.toISOString().substring(11, 16)
}

export const availabilitiesToBusinessHours = ({
  calendar,
}: {
  calendar: Calendar
}): BusinessHour[] => {
  return calendar.availabilities
    .filter((a) => a.type === 'SPECIFIED' && a.startTime && a.endTime)
    .map((a) => ({
      daysOfWeek: [a.date.getDay()],
      startTime: toTimeString(a.startTime!),
      endTime: toTimeString(a.endTime!),
    }))
}

export interface GeocodeResult {
  lat: number
  lng: number
}

export async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(address)}`

  const res = await fetch(url)
  if (!res.ok) return null

  const results = await res.json()
  if (!results.length) return null

  return {
    lat: parseFloat(results[0].lat),
    lng: parseFloat(results[0].lon),
  }
}
