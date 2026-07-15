export interface ClinicAddress {
  street: string
  postalCode: string
  city: string
  country: string
}

export interface OpeningHoursDay {
  dayOfWeek: number
  openTime: string
  closeTime: string
  closed: boolean
}

// dayOfWeek: 0 = Dimanche ... 6 = Samedi (convention alignée sur MeetingReccuring.dayOfWeek / RRULE_DAYS)
export const DAY_LABELS = [
  'Dimanche',
  'Lundi',
  'Mardi',
  'Mercredi',
  'Jeudi',
  'Vendredi',
  'Samedi',
]

export function formatAddress(address: Partial<ClinicAddress> | null | undefined): string {
  if (!address) return ''
  const { street, postalCode, city, country } = address
  const line = [street, [postalCode, city].filter(Boolean).join(' ')].filter(Boolean).join(', ')
  return country && country !== 'FR' ? `${line}, ${country}` : line
}

export function defaultOpeningHours(): OpeningHoursDay[] {
  return Array.from({ length: 7 }, (_, dayOfWeek) => ({
    dayOfWeek,
    openTime: '09:00',
    closeTime: dayOfWeek === 6 ? '13:00' : '19:00',
    closed: dayOfWeek === 0,
  })).sort((a, b) => a.dayOfWeek - b.dayOfWeek)
}

export function orderedByWeekday(hours: OpeningHoursDay[]): OpeningHoursDay[] {
  const byDay = new Map(hours.map((h) => [h.dayOfWeek, h]))
  return [1, 2, 3, 4, 5, 6, 0].map((day) => byDay.get(day)!).filter(Boolean)
}

export function formatOpeningHours(hours: OpeningHoursDay[] | null | undefined): string {
  if (!hours?.length) return ''
  return orderedByWeekday(hours)
    .map((day) =>
      day.closed
        ? `${DAY_LABELS[day.dayOfWeek]} : Fermé`
        : `${DAY_LABELS[day.dayOfWeek]} : ${day.openTime} - ${day.closeTime}`,
    )
    .join('\n')
}
