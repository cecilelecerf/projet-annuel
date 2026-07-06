import type { MeetingFrequency } from '@armali/schemas'
import dayjs from 'dayjs'

export type AvailabilityFormKind = 'RECURRING' | 'PUNCTUAL'

export interface AvailabilityForm {
  kind: AvailabilityFormKind
  dayOfWeek: number[]
  startTime: string
  endTime: string
  dateStart: string
  dateEnd: string
  date: string
  frequency: MeetingFrequency
}

export const DAYS = [
  { value: 1, label: 'Lun' },
  { value: 2, label: 'Mar' },
  { value: 3, label: 'Mer' },
  { value: 4, label: 'Jeu' },
  { value: 5, label: 'Ven' },
  { value: 6, label: 'Sam' },
  { value: 0, label: 'Dim' },
] as const

export function defaultForm(): AvailabilityForm {
  return {
    kind: 'RECURRING',
    dayOfWeek: [],
    startTime: '',
    endTime: '',
    dateStart: '',
    dateEnd: '',
    date: '',
    frequency: 'WEEKLY',
  }
}

export function validateForm(form: AvailabilityForm): string | null {
  if (!form.startTime || !form.endTime) return 'Les horaires de début et de fin sont requis.'
  if (form.startTime >= form.endTime) return "L'heure de fin doit être après l'heure de début."
  if (form.kind === 'RECURRING') {
    if (form.dayOfWeek.length === 0) return 'Sélectionne au moins un jour.'
    if (!form.dateStart || !form.dateEnd)
      return 'Les dates de début et de fin de la période sont requises.'
    if (form.dateStart >= form.dateEnd) return 'La date de fin doit être après la date de début.'
  } else {
    if (!form.date) return 'La date est requise.'
  }
  return null
}

export function toTimeDate(timeStr: string): Date {
  return dayjs(`1970-01-01T${timeStr}:00`).toDate()
}
