import { ref, computed, type Ref } from 'vue'
import dayjs from 'dayjs'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import frLocale from '@fullcalendar/core/locales/fr'
import type { AvailabilityResponse, ClinicId } from '@armali/schemas'

// Palette DS assignable aux clinics — natives + custom (cf. custom-colors.scss)
const CLINIC_COLOR_PALETTE = [
  'primary',
  'success',
  'warning',
  'purple',
  'pink',
  'teal',
  'yellow',
  'danger',
] as const

export type ClinicColor = (typeof CLINIC_COLOR_PALETTE)[number]

export interface ClinicColorEntry {
  clinicId: ClinicId
  clinicName: string
  color: ClinicColor
}

export function useAvailabilityCalendar(availabilities: Ref<AvailabilityResponse[]>) {
  const calendarStart = ref(dayjs().startOf('week'))
  const calendarEnd = ref(dayjs().endOf('week'))

  // Référence stable — calculée une seule fois, pas à chaque recalcul du computed
  // (sinon FullCalendar voit un nouvel objet Date à chaque render et se réinitialise,
  // ce qui redéclenche datesSet → recalcule les refs → boucle infinie)
  const validRangeStart = dayjs().startOf('week').toDate()

  function onDatesSet(info: { start: Date; end: Date }) {
    calendarStart.value = dayjs(info.start)
    calendarEnd.value = dayjs(info.end)
  }

  // ── Mapping clinic → couleur (déterministe, basé sur l'ordre d'apparition) ──
  const clinicColorList = computed<ClinicColorEntry[]>(() => {
    const seen = new Map<ClinicId, string>()
    for (const avail of availabilities.value) {
      if (!seen.has(avail.clinicId)) {
        seen.set(avail.clinicId, avail.clinic.name)
      }
    }
    return Array.from(seen.entries())
      .sort(([idA], [idB]) => String(idA).localeCompare(String(idB)))
      .map(([clinicId, clinicName], index) => ({
        clinicId,
        clinicName,
        color: CLINIC_COLOR_PALETTE[index % CLINIC_COLOR_PALETTE.length] ?? 'primary',
      }))
  })

  const clinicColorMap = computed<Map<ClinicId, ClinicColor>>(() => {
    return new Map(clinicColorList.value.map((entry) => [entry.clinicId, entry.color]))
  })

  function getClinicColor(clinicId: ClinicId): ClinicColor {
    return clinicColorMap.value.get(clinicId) ?? 'primary'
  }

  const calendarEvents = computed(() => {
    const events: Array<Record<string, unknown>> = []

    for (const avail of availabilities.value) {
      const color = getClinicColor(avail.clinicId)
      const eventStyle = {
        backgroundColor: `var(--el-color-${color}-light-7)`,
        borderColor: `var(--el-color-${color})`,
        textColor: `var(--el-color-${color}-dark-2)`,
      }

      if ('recurring' in avail) {
        // ── Récurrence — expand sur la fenêtre visible ──────────────────────────
        const rec = avail.recurring
        const winStart = dayjs(rec.dateStart).isAfter(calendarStart.value)
          ? dayjs(rec.dateStart)
          : calendarStart.value
        const winEnd = dayjs(rec.dateEnd).isBefore(calendarEnd.value)
          ? dayjs(rec.dateEnd)
          : calendarEnd.value

        let cursor = winStart
        while (cursor.isBefore(winEnd) || cursor.isSame(winEnd, 'day')) {
          if (rec.dayOfWeek.includes(cursor.day())) {
            events.push({
              id: `${avail.id}-${cursor.format('YYYY-MM-DD')}`,
              title: avail.clinic.name,
              start: cursor
                .hour(dayjs(rec.startTime).hour())
                .minute(dayjs(rec.startTime).minute())
                .second(0)
                .toDate(),
              end: cursor
                .hour(dayjs(rec.endTime).hour())
                .minute(dayjs(rec.endTime).minute())
                .second(0)
                .toDate(),
              display: 'block',
              ...eventStyle,
            })
          }
          cursor = cursor.add(1, 'day')
        }
      } else {
        // ── Ponctuelle ────────────────────────────────────────────────────────────
        const mtg = avail.meeting
        const d = dayjs(mtg.date)
        events.push({
          id: avail.id,
          title: avail.clinic.name,
          start: d
            .hour(dayjs(mtg.startTime).hour())
            .minute(dayjs(mtg.startTime).minute())
            .second(0)
            .toDate(),
          end: d
            .hour(dayjs(mtg.endTime).hour())
            .minute(dayjs(mtg.endTime).minute())
            .second(0)
            .toDate(),
          display: 'block',
          ...eventStyle,
        })
      }
    }

    return events
  })

  const calendarOptions = computed(() => ({
    plugins: [dayGridPlugin, timeGridPlugin],
    initialView: 'timeGridWeek',
    locale: frLocale,
    height: 580,
    headerToolbar: { left: 'prev', center: 'title', right: 'next' },
    slotMinTime: '06:00:00',
    slotMaxTime: '22:00:00',
    slotDuration: '00:30:00',
    slotLabelFormat: {
      hour: '2-digit' as const,
      minute: '2-digit' as const,
      hour12: false,
    },
    allDaySlot: false,
    validRange: {
      start: validRangeStart,
    },
    events: calendarEvents.value,
    eventTimeFormat: {
      hour: '2-digit' as const,
      minute: '2-digit' as const,
      meridiem: false,
      hour12: false,
    },
    nowIndicator: true,
    datesSet: onDatesSet,
  }))

  return {
    calendarOptions,
    clinicColorList,
    onDatesSet,
  }
}
