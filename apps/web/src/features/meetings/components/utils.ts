import type { Calendar, FlatMeeting } from '@armali/schemas'
import { match } from 'ts-pattern'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import type { EventInput } from '@fullcalendar/core/index.js'

dayjs.extend(utc)
dayjs.locale('fr')

// Combine le jour de `date` avec l'heure de `time`, en lisant les deux en UTC
// (les colonnes Prisma @db.Date/@db.Time sont sérialisées en UTC, peu importe
// le fuseau du navigateur/serveur) puis construit un Date local pour FullCalendar
export const combineDateAndTime = (date: Date, time: Date): Date => {
  const d = dayjs.utc(date)
  const t = dayjs.utc(time)
  return dayjs()
    .year(d.year())
    .month(d.month())
    .date(d.date())
    .hour(t.hour())
    .minute(t.minute())
    .second(t.second())
    .millisecond(0)
    .toDate()
}

export function formatDate(date: Date) {
  return dayjs(date).format('dddd D MMMM YYYY')
}

export function formatTime(date: Date): string {
  return dayjs(date).format('H[h]mm')
}
export function subtractTime(start: Date, end: Date) {
  return `${formatTime(start)} — ${formatTime(end)}`
}
export const timeStringToDate = (time: string): Date => {
  return dayjs.utc(`1970-01-01T${time}`).toDate()
}

export const toCalendarEvent = (base: FlatMeeting) => {
  const date = base.date

  const start = date && base.startTime ? combineDateAndTime(date, base.startTime) : date
  const end = date && base.endTime ? combineDateAndTime(date, base.endTime) : undefined

  const resultBase = {
    id: `${base.id}_${dayjs.utc(date).toISOString()}`,
    start: start,
    end: end,
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

function toTimeString(date: Date): string {
  return dayjs.utc(date).format('HH:mm')
}

const CLINIC_COLOR_PALETTE = [
  '#409eff',
  '#e6a23c',
  '#f56c6c',
  '#9f6de0',
  '#2ec7c9',
  '#909399',
  '#ff9f7f',
]

function hashClinicId(clinicId: string): number {
  let hash = 0
  for (let i = 0; i < clinicId.length; i++) {
    hash = (hash * 31 + clinicId.charCodeAt(i)) >>> 0
  }
  return hash
}

export function getClinicColor(clinicId: string): string {
  const index = hashClinicId(clinicId) % CLINIC_COLOR_PALETTE.length
  const color = CLINIC_COLOR_PALETTE[index]
  if (!color) throw new Error('color clinic not found')
  return color
}

type BusinessHour = {
  daysOfWeek: number[]
  startTime: string
  endTime: string
}

export const availabilitiesToBusinessHours = ({
  calendar,
  clinicIds,
}: {
  calendar: Calendar
  clinicIds?: string[]
}): BusinessHour[] => {
  return calendar.availabilities
    .filter(
      (a) =>
        a.type === 'SPECIFIED' &&
        a.kind === 'AVAILABILITY' &&
        a.startTime &&
        a.endTime &&
        (!clinicIds || clinicIds.length === 0 || clinicIds.includes(a.clinic.id)),
    )
    .map((a) => {
      if (a.kind !== 'AVAILABILITY') throw new Error('is not availability')
      return {
        daysOfWeek: [dayjs.utc(a.date).day()],
        startTime: toTimeString(a.startTime!),
        endTime: toTimeString(a.endTime!),
      }
    })
}

export const availabilitiesToBackgroundEvents = ({
  calendar,
  clinicIds,
}: {
  calendar: Calendar
  clinicIds?: string[]
}): EventInput[] => {
  return calendar.availabilities
    .filter((a) => a.type === 'SPECIFIED' && a.startTime && a.endTime)
    .filter(
      (a) =>
        a.kind === 'AVAILABILITY' &&
        (!clinicIds || clinicIds.length === 0 || clinicIds.includes(a.clinic.id)),
    )
    .map((a) => {
      if (a.kind !== 'AVAILABILITY') throw new Error('is not availbility')

      return {
        start: combineDateAndTime(a.date, a.startTime!),
        end: combineDateAndTime(a.date, a.endTime!),
        display: 'background',
        backgroundColor: getClinicColor(a.clinic.id),
        extendedProps: { clinicId: a.clinic.id, clinicName: a.clinic.name },
      }
    })
}

export function extractDistinctClinics(calendar: Calendar | null): { id: string; name: string }[] {
  if (!calendar) return []

  const seen = new Map<string, string>()
  calendar.availabilities.forEach((a) => {
    if (a.kind !== 'AVAILABILITY') return
    seen.set(a.clinic.id, a.clinic.name)
  })

  return Array.from(seen.entries()).map(([id, name]) => ({ id, name }))
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
