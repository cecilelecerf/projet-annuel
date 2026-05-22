import { calendarApi } from '../api/calendar.api'
import type { Calendar, MeetingId, UserId } from '@armali/schemas'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin, { type DateClickArg } from '@fullcalendar/interaction'
import dayjs from 'dayjs'
import { ref } from 'vue'
import { availabilitiesToBusinessHours, toCalendarEvent } from '../components/utils'
import type {
  CalendarOptions,
  DatesSetArg,
  EventClickArg,
  EventContentArg,
  EventInput,
} from '@fullcalendar/core/index.js'
import type { VerboseFormattingArg } from '@fullcalendar/core/internal'
import { useAuthStore } from '@/stores/authStore'

export function useCalendar(userId?: UserId) {
  const calendarData = ref<Calendar | null>(null)
  const dateSelect = ref<Date | null>(null)
  const openNewEvent = ref(false)
  const selectedMeeting = ref<string | null>(null)

  const fetchMeetings = (startStr: string, endStr: string) => {
    const start = dayjs(startStr).format('YYYY-MM-DD')
    const end = dayjs(endStr).format('YYYY-MM-DD')
    return calendarApi.getCalendar(start, end, userId)
  }
  const calendarOptions = ref<CalendarOptions>({
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
    initialView: 'timeGridWeek',
    locale: 'fr',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay,newEventButton',
    },
    customButtons: {
      newEventButton: {
        text: '+ Nouvel événement',
        click: () => {
          openNewEvent.value = true
        },
      },
    },
    views: {
      dayGridMonth: {
        eventTimeFormat: (date: VerboseFormattingArg) => {
          const hours = String(date.date.hour).padStart(2, '0')
          const minutes = date.date.minute === 0 ? '' : String(date.date.minute).padStart(2, '0')
          return minutes ? `${hours}h${minutes}` : `${hours}h`
        },
      },
    },
    slotMinTime: '07:00:00',
    slotMaxTime: '20:00:00',
    allDaySlot: false,
    events: [] as EventInput[],
    eventColor: '#409eff',
    businessHours: [{}],
    eventClassNames: (arg: EventContentArg) => [
      `kind-${arg.event.extendedProps.kind}`,
      `status-${arg.event.extendedProps.status}`,
    ],
    dateClick: (info: DateClickArg) => {
      dateSelect.value = info.date
    },
    eventClick: (info: EventClickArg) => {
      console.log('RDV cliqué', info.event.id)
      selectedMeeting.value = info.event.id
    },
    datesSet: async (info: DatesSetArg) => {
      const meetings = await fetchMeetings(info.startStr, info.endStr)
      calendarData.value = meetings
      calendarOptions.value.events = calendarData.value!.meetings.map(toCalendarEvent)
      calendarOptions.value.businessHours = availabilitiesToBusinessHours({
        calendar: calendarData.value!,
      })
    },
  })
  return { calendarOptions, dateSelect, openNewEvent, selectedMeeting }
}
