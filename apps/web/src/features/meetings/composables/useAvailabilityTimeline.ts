import { computed, onUnmounted, ref, watch, type Ref } from 'vue'
import type { ClinicId, VeterinarianId, AvailabilityTimeline } from '@armali/schemas'
import { meetingApi } from '../api/meeting.api'

export interface TimelineSegment {
  kind: 'available' | 'busy' | 'off'
  startPercent: number
  widthPercent: number
}

const FALLBACK_START_MINUTES = 8 * 60
const FALLBACK_END_MINUTES = 19 * 60
const PADDING_MINUTES = 30

// Les Date venant du backend sont ancrées en UTC (colonnes Prisma @db.Time) :
// on lit toujours en UTC, jamais en heure locale, pour éviter le décalage été/hiver
function toMinutesOfDay(d: Date): number {
  return d.getUTCHours() * 60 + d.getUTCMinutes()
}

// Les valeurs des el-time-picker sont des strings "HH:mm:ss" : on les parse
// directement, sans jamais passer par Date/dayjs (source du bug précédent)
function timeStringToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  if (!h || !m) throw new Error('not split')
  return h * 60 + m
}

export function useAvailabilityTimeline({
  veterinarianId,
  clinicId,
  date,
}: {
  veterinarianId: Ref<VeterinarianId | undefined>
  clinicId: Ref<ClinicId | undefined>
  date: Ref<Date>
}) {
  const timeline = ref<AvailabilityTimeline | null>(null)
  const loading = ref(false)

  let isDisposed = false
  onUnmounted(() => {
    isDisposed = true
  })

  async function fetchTimeline() {
    if (!veterinarianId.value || !clinicId.value) {
      if (!isDisposed) timeline.value = null

      timeline.value = null
      return
    }

    loading.value = true
    try {
      const result = await meetingApi.availability.getTimeline({
        veterinarianId: veterinarianId.value,
        clinicId: clinicId.value,
        date: date.value,
      })
      if (!isDisposed) timeline.value = result
    } finally {
      loading.value = false
      if (!isDisposed) loading.value = false
    }
  }

  watch([veterinarianId, clinicId, date], fetchTimeline, { immediate: true })

  const dayBounds = computed<{ startMinutes: number; endMinutes: number }>(() => {
    if (!timeline.value) {
      return { startMinutes: FALLBACK_START_MINUTES, endMinutes: FALLBACK_END_MINUTES }
    }

    const allMinutes = [
      ...timeline.value.windows.flatMap((w) => [toMinutesOfDay(w.start), toMinutesOfDay(w.end)]),
      ...timeline.value.busy.flatMap((b) => [toMinutesOfDay(b.start), toMinutesOfDay(b.end)]),
    ]

    if (allMinutes.length === 0) {
      return { startMinutes: FALLBACK_START_MINUTES, endMinutes: FALLBACK_END_MINUTES }
    }

    return {
      startMinutes: Math.max(0, Math.min(...allMinutes) - PADDING_MINUTES),
      endMinutes: Math.min(24 * 60, Math.max(...allMinutes) + PADDING_MINUTES),
    }
  })

  function minutesToPercent(minutes: number): number {
    const { startMinutes, endMinutes } = dayBounds.value
    const total = endMinutes - startMinutes
    return Math.min(100, Math.max(0, ((minutes - startMinutes) / total) * 100))
  }

  const segments = computed<TimelineSegment[]>(() => {
    if (!timeline.value) return []

    const { startMinutes: dayStart, endMinutes: dayEnd } = dayBounds.value

    const windowRanges = timeline.value.windows.map((w) => ({
      start: toMinutesOfDay(w.start),
      end: toMinutesOfDay(w.end),
    }))
    const busyRanges = timeline.value.busy.map((b) => ({
      start: toMinutesOfDay(b.start),
      end: toMinutesOfDay(b.end),
    }))

    const boundaries = [
      dayStart,
      dayEnd,
      ...windowRanges.flatMap((w) => [w.start, w.end]),
      ...busyRanges.flatMap((b) => [b.start, b.end]),
    ]
      .filter((m) => m >= dayStart && m <= dayEnd)
      .sort((a, b) => a - b)

    const uniqueBoundaries = [...new Set(boundaries)]

    const result: TimelineSegment[] = []

    for (let i = 0; i < uniqueBoundaries.length - 1; i++) {
      const segStart = uniqueBoundaries[i]
      const segEnd = uniqueBoundaries[i + 1]
      if (!segStart || !segEnd) throw new Error('not segment')

      const midpoint = (segStart + segEnd) / 2

      const isInWindow = windowRanges.some((w) => w.start <= midpoint && midpoint <= w.end)
      const isBusy = busyRanges.some((b) => b.start <= midpoint && midpoint <= b.end)

      const kind: TimelineSegment['kind'] = isBusy ? 'busy' : isInWindow ? 'available' : 'off'

      result.push({
        kind,
        startPercent: minutesToPercent(segStart),
        widthPercent: minutesToPercent(segEnd) - minutesToPercent(segStart),
      })
    }

    return result
  })

  // Prend directement des strings "HH:mm:ss" (valeurs des time-pickers)
  function isRangeValid(rangeStartTime: string, rangeEndTime: string): boolean {
    if (!timeline.value) return false
    if (!rangeStartTime || !rangeEndTime) return false

    const rangeStart = timeStringToMinutes(rangeStartTime)
    const rangeEnd = timeStringToMinutes(rangeEndTime)

    if (rangeStart >= rangeEnd) return false

    const fitsInWindow = timeline.value.windows.some((w) => {
      const wStart = toMinutesOfDay(w.start)
      const wEnd = toMinutesOfDay(w.end)
      return wStart <= rangeStart && rangeEnd <= wEnd
    })
    if (!fitsInWindow) return false

    const overlapsBusy = timeline.value.busy.some((b) => {
      const bStart = toMinutesOfDay(b.start)
      const bEnd = toMinutesOfDay(b.end)
      return rangeStart < bEnd && bStart < rangeEnd
    })
    return !overlapsBusy
  }

  function timeToPercent(time: string): number {
    if (!time) return 0
    return minutesToPercent(timeStringToMinutes(time))
  }

  return {
    timeline,
    loading,
    dayBounds,
    segments,
    isRangeValid,
    refetch: fetchTimeline,
    timeToPercent,
  }
}
