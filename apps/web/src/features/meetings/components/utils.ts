import type {
  AnimalMeeting,
  Calendar,
  FlatMeeting,
  InternalMeeting,
  Meeting,
} from '@armali/schemas'
import { match } from 'ts-pattern'

export const toCalendarEvent = (base: FlatMeeting) => {
  const date = base.specificDate ?? base.dateStart

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
    id: base.id,
    start: start?.toISOString(),
    end: end?.toISOString(),
  }
  return match(base)
    .with({ kind: 'ANIMAL' }, (b) => ({
      ...resultBase,
      title: b.description ?? '',
      extendedProps: { kind: base.kind, description: b.ownedPetId },
    }))
    .with({ kind: 'INTERNAL' }, (b) => ({
      ...resultBase,
      title: b.title,
      extendedProps: { kind: base.kind, description: b.clinicId, status: b.status },
    }))
    .otherwise(() => ({ ...resultBase, title: 'RDV' }))
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
    .filter((a) => a.type === 'SPECIFIED' && a.dayOfWeek != null && a.startTime && a.endTime)
    .map((a) => ({
      daysOfWeek: [a.dayOfWeek!],
      startTime: toTimeString(a.startTime!),
      endTime: toTimeString(a.endTime!),
    }))
}
