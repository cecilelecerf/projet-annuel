<script setup lang="ts">
import { type Calendar, type UserId } from '@armali/schemas'
import FullCalendar from '@fullcalendar/vue3'

import dayjs from 'dayjs'
import 'dayjs/locale/fr'
import { createApp, h, ref } from 'vue'
import { calendarApi } from '../api/calendar.api'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { availabilitiesToBusinessHours, toCalendarEvent } from './utils'
import InternalEventCard from './InternalEventCard.vue'
import AnimalEventCard from './AnimalEventCard.vue'
import ElementPlus from 'element-plus'
dayjs.locale('fr')

const { date, userId } = defineProps<{
  date: string
  userId?: UserId
}>()
defineEmits<{ close: [] }>()

const calendar = ref<Calendar | null>(null)
const formatted = dayjs(date).format('YYYY-MM-DD')

calendarApi.getCalendar(formatted, formatted, userId).then((data) => (calendar.value = data))

const formattedDate = dayjs(date).format('YYYY-MM-DD')

const calendarOptions = ref({
  plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
  initialView: 'timeGridDay',
  initialDate: formatted,
  locale: 'fr',
  headerToolbar: false,
  slotMinTime: '07:00:00',
  slotMaxTime: '20:00:00',
  allDaySlot: false,
  events: [] as any[],
  eventColor: '#409eff',
  businessHours: [{}],
  eventClassNames: (arg: any) =>
    arg.event.extendedProps.kind === 'INTERNAL' ? ['event-internal'] : ['event-animal'],
  eventClick: (info: any) => console.log('RDV cliqué', info.event.title),
  eventContent: (arg: any) => {
    const mount = document.createElement('div')
    mount.style.height = '100%'
    const kind = arg.event.extendedProps.kind
    const component = kind === 'INTERNAL' ? InternalEventCard : AnimalEventCard

    const app = createApp({
      render: () =>
        h(component, {
          event: arg.event,
          start: arg.event.start,
          end: arg.event.end,
        }),
    })
    app.use(ElementPlus)
    app.mount(mount)
    return { domNodes: [mount] }
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
      <FullCalendar :options="calendarOptions" />
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
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

// ── FullCalendar overrides ────────────────────────────────────────────────────

:deep(.fc) {
  flex: 1;
  height: 100%;
  min-height: 0;
}

:deep(.fc-view-harness) {
  flex: 1 !important;
  min-height: 0 !important;
  height: auto !important;
}

// Supprimer toutes les lignes de bordure
:deep(.fc-scrollgrid),
:deep(.fc-scrollgrid td),
:deep(.fc-scrollgrid th),
:deep(.fc-timegrid-slot),
:deep(.fc-timegrid-col) {
  border: none !important;
}
:deep(.fc-scroller) {
  height: 100% !important;
  overflow-y: auto !important;
}

// Masquer la colonne de gauche (axis vide) et déplacer les horaires à droite
:deep(.fc-timegrid-axis) {
  display: none;
}

:deep(.fc-timegrid-slot-label) {
  text-align: right;
  padding-right: var(--spacing-xs);
  font-size: 11px;
  color: var(--el-text-color-placeholder);
  border: none !important;
  vertical-align: top;
}

:deep(.fc-timegrid-slot-label-cushion) {
  font-size: 11px;
  color: var(--el-text-color-placeholder);
}

// Colonne horaire à droite
:deep(.fc-timegrid-slots table) {
  direction: rtl;

  td:first-child {
    direction: ltr;
  }
}

// Ligne du moment actuel
:deep(.fc-timegrid-now-indicator-line) {
  border-color: var(--el-color-primary);
}

:deep(.fc-timegrid-now-indicator-arrow) {
  border-top-color: var(--el-color-primary);
  border-bottom-color: var(--el-color-primary);
}

// Header du jour — masquer
:deep(.fc-col-header) {
  display: none;
}

// Scrollbar discrète
:deep(.fc-scroller) {
  scrollbar-width: thin;
  scrollbar-color: var(--el-border-color) transparent;

  &::-webkit-scrollbar {
    width: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background: var(--el-border-color);
    border-radius: var(--radius-full);
  }
}

:deep(.fc-event-time) {
  font-size: 11px;
  opacity: 0.8;
}
</style>
