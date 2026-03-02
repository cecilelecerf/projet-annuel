<script setup lang="ts">
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { ref } from 'vue'
import { api } from '@/lib/api'
import { calendarSchema, type Meeting, type UserId } from '@schemas'
import dayjs from 'dayjs'
import { match } from 'ts-pattern'
const { userId } = defineProps<{
  userId?: UserId
}>()
const toCalendarEvent = (base: Meeting) => {
  const date = base.specificDate ?? base.dateStart
  const title = match(base)
    .with({ kind: 'ANIMAL' }, (b) => b.description)
    .with({ kind: 'INTERNAL' }, (b) => b.title)
    .otherwise(() => 'RDV')
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
  return {
    id: base.specificDate ? `${base.id}_${base.specificDate.toISOString().split('T')[0]}` : base.id,
    title,
    start: start?.toISOString(),
    end: end?.toISOString(),
    extendedProps: { type: base.kind },
  }
}

async function fetchMeetings(info: { startStr: string; endStr: string; id?: UserId }) {
  const start = dayjs(info.startStr).format('YYYY-MM-DD')
  const end = dayjs(info.endStr).format('YYYY-MM-DD')
  return api(`/meetings${info.id ? '/' + info.id : ''}?startDate=${start}&endDate=${end}`).then(
    (data) => {
      const parsed = calendarSchema.parse(data)
      return parsed.mettings.map(toCalendarEvent)
    },
  )
}

const calendarOptions = ref({
  plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
  initialView: 'timeGridWeek',
  locale: 'fr',
  headerToolbar: {
    left: 'prev,next today',
    center: 'title',
    right: 'dayGridMonth,timeGridWeek,timeGridDay',
  },
  slotMinTime: '07:00:00',
  slotMaxTime: '20:00:00',
  allDaySlot: false,
  events: [] as any[],
  eventColor: '#409eff',

  businessHours: {
    daysOfWeek: [1, 2, 3],
    startTime: '9:00',
    endTime: '18:00',
  },
  eventClassNames: (arg: any) => {
    console.log(arg.event.extendedProps)
    return arg.event.extendedProps.type === 'INTERNAL' ? ['event-internal'] : ['event-animal']
  },
  dateClick: (info: any) => console.log('Clic sur', info.dateStr),
  eventClick: (info: any) => console.log('RDV cliqué', info.event.title),
  datesSet: async (info: any) => {
    calendarOptions.value.events = await fetchMeetings({
      startStr: info.startStr,
      endStr: info.endStr,
      id: userId,
    })
  },
})
</script>

<template>
  <FullCalendar :options="calendarOptions" />
</template>

<style scoped>
:deep(.event-animal) {
  background-color: var(--el-color-primary-light-3) !important;
  border-color: var(--el-color-primary-light-3) !important;
}
:deep(.event-internal) {
  background-color: var(--el-color-pink) !important;
  border-color: var(--el-color-pink) !important;
}
</style>
