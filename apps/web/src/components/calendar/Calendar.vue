<script setup lang="ts">
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { ref } from 'vue'
import { api } from '@/lib/api'
import { calendarSchema, type Calendar, type UserId } from '@armali/schemas'
import dayjs from 'dayjs'
import { availabilitiesToBusinessHours, toCalendarEvent } from './utils'
const { userId } = defineProps<{
  userId?: UserId
}>()
const calendarData = ref<Calendar | null>(null)

async function fetchMeetings(info: { startStr: string; endStr: string; id?: UserId }) {
  const start = dayjs(info.startStr).format('YYYY-MM-DD')
  const end = dayjs(info.endStr).format('YYYY-MM-DD')
  return api(`/meetings${info.id ? '/' + info.id : ''}?startDate=${start}&endDate=${end}`).then(
    (data) => calendarSchema.parse(data),
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
  businessHours: [{}],
  eventClassNames: (arg: any) => {
    console.log(arg.event.extendedProps)
    return arg.event.extendedProps.type === 'INTERNAL' ? ['event-internal'] : ['event-animal']
  },
  dateClick: (info: any) => console.log('Clic sur', info.dateStr),
  eventClick: (info: any) => console.log('RDV cliqué', info.event.title),
  datesSet: async (info: any) => {
    calendarData.value = await fetchMeetings({ ...info, id: userId })
    calendarOptions.value.events = calendarData.value.meetings.map(toCalendarEvent)
    calendarOptions.value.businessHours = availabilitiesToBusinessHours({
      calendar: calendarData.value,
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
