<script setup lang="ts">
import { type Calendar, type UserId } from '@armali/schemas'
import FullCalendar from '@fullcalendar/vue3'

import dayjs from 'dayjs'
import 'dayjs/locale/fr'
import { ref } from 'vue'
import { calendarApi } from '../../api/calendar.api'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin, { type DateClickArg } from '@fullcalendar/interaction'
import { availabilitiesToBusinessHours, toCalendarEvent } from '../utils'
import EventCard from './EventCalendar.vue'
import type {
  CalendarOptions,
  EventClickArg,
  EventContentArg,
  EventInput,
} from '@fullcalendar/core'

dayjs.locale('fr')

const { date, userId } = defineProps<{
  date: Date
  userId?: UserId
}>()
const emit = defineEmits<{ close: []; newEvent: [date: Date] }>()

const calendar = ref<Calendar | null>(null)
const formatted = dayjs(date).format('YYYY-MM-DD')

calendarApi.getCalendar(formatted, formatted, userId).then((data) => (calendar.value = data))

const formattedDate = dayjs(date).format('YYYY-MM-DD')

const calendarOptions = ref<CalendarOptions>({
  plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
  initialView: 'timeGridDay',
  initialDate: formatted,
  locale: 'fr',
  headerToolbar: false,
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
  eventClick: (info: EventClickArg) => console.log('RDV cliqué', info.event.title),
  dateClick: (info: DateClickArg) => {
    emit('newEvent', info.date)
  },
  datesSet: async () => {
    const data = await calendarApi.getCalendar(formatted, formatted, userId)
    calendar.value = data
    calendarOptions.value.events = data.meetings.map(toCalendarEvent)
    calendarOptions.value.businessHours = availabilitiesToBusinessHours({ calendar: data })
  },
})
</script>

<template>
  <div class="drawer">
    <div class="drawer-header">
      <div>
        <p class="drawer-date">{{ formattedDate }}</p>
        <p class="drawer-count" v-if="calendar">
          {{ calendar.meetings.length }} événement{{ calendar.meetings.length > 1 ? 's' : '' }}
        </p>
      </div>
      <el-icon class="close-btn" @click="$emit('close')"><CloseBold /></el-icon>
    </div>

    <div class="drawer-content">
      <FullCalendar :options="calendarOptions">
        <template v-slot:slotLaneContent=""><div class="slot-lane-content"></div></template>
        <template v-slot:eventContent="arg">
          <EventCard
            :title="arg.event.title"
            :start="arg.event.start"
            :end="arg.event.end"
            :description="arg.event.extendedProps.description"
            :kind="arg.event.extendedProps.kind"
            :status="arg.event.extendedProps.status"
          />
        </template>
      </FullCalendar>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.drawer {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: var(--spacing-lg);
  border-bottom: 1px solid var(--el-border-color-lighter);
  flex-shrink: 0;
}

.drawer-date {
  font-family: 'Nunito', sans-serif;
  font-weight: var(--fw-bold);
  font-size: 16px;
  color: var(--el-text-color-primary);
  margin: 0;
  text-transform: capitalize;
}

.drawer-count {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  margin: 4px 0 0;
}

.close-btn {
  cursor: pointer;
  font-size: 18px;
  color: var(--el-text-color-secondary);
  transition: color 0.2s;
  &:hover {
    color: var(--el-text-color-primary);
  }
}
.drawer-content {
  flex: 1;
  display: flex;
}

.slot-lane-content {
  width: 100%;
  height: 100%;
  cursor: pointer;
  transition: background 0.15s;
  position: relative;

  &::after {
    content: '+ Nouvel événement';
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    color: var(--el-text-color-placeholder);
    opacity: 0;
    transition: opacity 0.15s;
    pointer-events: none;
  }

  &:hover {
    background: var(--el-fill-color-light) !important;

    &::after {
      opacity: 1;
    }
  }
}

:deep(thead[role='rowgroup']) {
  display: none;
}
:deep(.fc) {
  flex: 1;
  display: flex;
  flex-direction: column;
}
:deep(.fc-timegrid-slots table) {
  direction: rtl;

  td:first-child {
    direction: ltr;
  }
}
:deep(.fc-timegrid-col-events) {
  margin: unset;
}
:deep(.fc-timegrid-cols table) {
  direction: rtl;
}
:deep(.fc-timegrid-event) {
  box-shadow: none !important;
}

:deep(.fc-scrollgrid) {
  border: none !important;
}

:deep(.fc-scrollgrid td),
:deep(.fc-scrollgrid th) {
  border: none !important;
}

:deep(.fc-timegrid-slot) {
  border: none !important;
}

:deep(.fc-timegrid-col) {
  border: none !important;
}

:deep(.fc-timegrid-axis) {
  border: none !important;
}
</style>
