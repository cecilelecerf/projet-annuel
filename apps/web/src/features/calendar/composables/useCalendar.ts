import { calendarApi } from '../api/calendar.api'
import type { Calendar, UserId } from '@armali/schemas'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import dayjs from 'dayjs'
import { ref } from 'vue'
import { availabilitiesToBusinessHours, toCalendarEvent } from '../components/utils'

export function useCalendar(userId?: UserId) {
  const calendarData = ref<Calendar | null>(null)
  const dateSelect = ref<Date | null>(null)
  const openNewEvent = ref(false)

  const fetchMeetings = (startStr: string, endStr: string) => {
    const start = dayjs(startStr).format('YYYY-MM-DD')
    const end = dayjs(endStr).format('YYYY-MM-DD')
    return calendarApi.getCalendar(start, end, userId)
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
    eventClassNames: (arg: any) =>
      arg.event.extendedProps.kind === 'INTERNAL' ? ['event-internal'] : ['event-animal'],
    dateClick: (info: any) => {
      dateSelect.value = info.dateStr
    },
    eventClick: (info: any) => console.log('RDV cliqué', info.event.title),
    datesSet: async (info: any) => {
      calendarData.value = await fetchMeetings(info.startStr, info.endStr)
      calendarOptions.value.events = calendarData.value!.meetings.map(toCalendarEvent)
      calendarOptions.value.businessHours = availabilitiesToBusinessHours({
        calendar: calendarData.value!,
      })
    },
  })
  return { calendarOptions, dateSelect, openNewEvent }
}
