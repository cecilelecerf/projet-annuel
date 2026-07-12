import { meetingApi } from '../api/meeting.api'
import type { Calendar, MeetingKind, UserId } from '@armali/schemas'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin, { type DateClickArg } from '@fullcalendar/interaction'
import dayjs from 'dayjs'
import { computed, ref, watch } from 'vue'
import {
  availabilitiesToBackgroundEvents,
  availabilitiesToBusinessHours,
  extractDistinctClinics,
  toCalendarEvent,
} from '../components/utils'
import type {
  CalendarOptions,
  DatesSetArg,
  EventClickArg,
  EventContentArg,
  EventInput,
} from '@fullcalendar/core/index.js'
import type { VerboseFormattingArg } from '@fullcalendar/core/internal'
import { useRoute } from 'vue-router'
dayjs.locale('fr')

export function useCalendar() {
  const route = useRoute()

  const calendarData = ref<Calendar | null>(null)
  const dateSelect = ref<Date | null>(null)
  const openNewEvent = ref(false)
  const selectedMeeting = ref<{
    id: string
    isReccuring?: boolean
    date: Date
    kind: Extract<MeetingKind, 'INTERNAL' | 'ANIMAL'>
  } | null>(null)

  // Filtre multi-cliniques : vide = toutes les cliniques affichées
  const selectedClinicIds = ref<string[]>([])

  const availableClinics = computed(() => extractDistinctClinics(calendarData.value))
  const id = computed(() => {
    const value = route.params.id
    return typeof value === 'string' ? value : undefined
  })

  const fetchMeetings = async (startStr: string, endStr: string) => {
    const start = dayjs(startStr).format('YYYY-MM-DD')
    const end = dayjs(endStr).format('YYYY-MM-DD')
    if (id.value) {
      return await meetingApi.getVeterinarianCalendar({ start, end, userId: id.value as UserId })
    }

    return await meetingApi.getCalendar({ start, end })
  }

  function refreshDisplayedEvents() {
    if (!calendarData.value) return
    calendarOptions.value.events = calendarData.value.meetings.map(toCalendarEvent)
    calendarOptions.value.events = [
      ...calendarOptions.value.events,
      ...availabilitiesToBackgroundEvents({
        calendar: calendarData.value,
        clinicIds: selectedClinicIds.value,
      }),
    ]
    calendarOptions.value.businessHours = availabilitiesToBusinessHours({
      calendar: calendarData.value,
      clinicIds: selectedClinicIds.value,
    })
  }

  // Recalcule l'affichage localement quand le filtre change,
  // sans refetch réseau (les données sont déjà toutes en mémoire)
  watch(selectedClinicIds, refreshDisplayedEvents)

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
    eventClassNames: (arg: EventContentArg) => [
      `kind-${arg.event.extendedProps.kind}`,
      `status-${arg.event.extendedProps.status}`,
    ],
    dateClick: (info: DateClickArg) => {
      dateSelect.value = info.date
    },
    eventClick: (info: EventClickArg) => {
      const [id] = info.event.id.split('_')
      if (!id) return
      selectedMeeting.value = {
        id: id,
        date: info.event.extendedProps.date,
        kind: info.event.extendedProps.kind,
      }
    },
    datesSet: async (info: DatesSetArg) => {
      const meetings = await fetchMeetings(info.startStr, info.endStr)
      calendarData.value = meetings
      refreshDisplayedEvents()
    },
  })

  return {
    calendarOptions,
    dateSelect,
    openNewEvent,
    selectedMeeting,
    selectedClinicIds,
    availableClinics,
  }
}
