import type { Calendar, FlatMeeting, Meeting } from '@armali/schemas'
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
    id: base.id,
    start: start?.toISOString(),
    end: end?.toISOString(),
  }
  return match(base)
    .with({ kind: 'ANIMAL' }, (b) => ({
      ...resultBase,
      title: b.description ?? '',
      extendedProps: {
        kind: base.kind,
        description: b.ownedPetId,

        date: b.recurringId ? b.date : undefined,
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
