<script setup lang="ts">
import FullCalendar from '@fullcalendar/vue3'
import DateDrawer from './DateDrawer.vue'
import NewEvent from '../NewEventDrawer/index.vue'
import { useCalendar } from '../../composables/useCalendar'
import { computed, ref } from 'vue'
import EventPopup from '../EventPopup.vue'
import type { UserId } from '@armali/schemas'
const { userId } = defineProps<{
  userId?: UserId
}>()
const { calendarOptions, dateSelect, openNewEvent, selectedMeeting } = useCalendar(userId)
const newEventDate = ref<Date | null>(null)

const isDateDrawerOpen = computed({
  get: () => dateSelect.value !== null,
  set: (val) => {
    if (!val) dateSelect.value = null
  },
})

const onNewEventDrawerClose = () => {
  openNewEvent.value = false
  newEventDate.value = null
}
</script>

<template>
  <div class="calendar-wrapper">
    <div class="calendar-container">
      <FullCalendar :options="calendarOptions"> </FullCalendar>
    </div>

    <el-drawer v-model="isDateDrawerOpen" direction="rtl" :with-header="false" size="420px">
      <DateDrawer
        v-if="dateSelect !== null"
        :date="dateSelect"
        @close="dateSelect = null"
        :user-id="userId"
        @new-event="
          (date) => {
            newEventDate = date
            openNewEvent = true
          }
        "
      />
    </el-drawer>

    <el-drawer
      v-model="openNewEvent"
      direction="rtl"
      :with-header="false"
      size="420px"
      @close="onNewEventDrawerClose"
    >
      <NewEvent
        :key="newEventDate?.toISOString()"
        @close="onNewEventDrawerClose"
        :initial-date="newEventDate"
      />
    </el-drawer>
    <EventPopup
      v-if="selectedMeeting"
      :meetingId="selectedMeeting"
      @close="selectedMeeting = null"
      @delete="selectedMeeting = null"
    />
  </div>
</template>

<style scoped>
.calendar-wrapper {
  padding: var(--spacing-lg);
}

.calendar-container {
  flex: 1;
  min-height: 0;
  border-radius: var(--radius-lg);
  overflow: hidden;
  border: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
}

:deep(.fc) {
  height: 100%;
}

/* Header toolbar */
:deep(.fc-toolbar) {
  padding: var(--spacing-md) var(--spacing-lg);
  border-bottom: 1px solid var(--el-border-color-lighter);
  margin: 0 !important;
}

:deep(.fc-toolbar-title) {
  font-size: var(--el-font-size-large);
  font-weight: 700;
}

:deep(.fc-button) {
  background: transparent !important;
  border: 1px solid var(--el-border-color) !important;
  color: var(--el-text-color-regular) !important;
  border-radius: var(--radius-md) !important;
  font-family: 'DM Sans', sans-serif !important;
  font-size: 13px !important;
  padding: 4px 10px !important;
  box-shadow: none !important;
  transition: all 0.15s !important;
  &:hover {
    background: var(--el-fill-color-light) !important;
    border-color: var(--el-color-primary) !important;
    color: var(--el-color-primary) !important;
  }
}

:deep(.fc-button-active),
:deep(.fc-button-primary:not(:disabled).fc-button-active) {
  background: var(--el-color-primary) !important;
  border-color: var(--el-color-primary) !important;
  color: white !important;
}

:deep(.fc-button-group) {
  gap: var(--spacing-sm);
}

:deep(.fc-today-button) {
  text-transform: capitalize;
}

:deep(.fc-col-header-cell) {
  padding: var(--spacing-sm) 0;
  border: none !important;
  background: var(--el-fill-color-extra-light);
}

:deep(.fc-col-header-cell-cushion) {
  font-size: var(--el-font-size-base);
  font-weight: 600;
  color: var(--el-text-color-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  text-decoration: none;
}

:deep(.fc-scrollgrid),
:deep(.fc-scrollgrid td),
:deep(.fc-scrollgrid th) {
  border-color: var(--el-border-color-lighter) !important;
}

:deep(.fc-timegrid-slot) {
  height: 30px;
  border-color: var(--el-border-color-extra-light) !important;
}

:deep(.fc-timegrid-slot-label-cushion) {
  font-size: 11px;
  color: var(--el-text-color-placeholder);
}

:deep(.fc-timegrid-axis) {
  border: none !important;
}

/* Jour actuel */
:deep(.fc-day-today) {
  background: color-mix(in srgb, var(--el-color-primary) 4%, transparent) !important;
}

:deep(.fc-day-today .fc-col-header-cell-cushion) {
  color: var(--el-color-primary);
}

/* Now indicator */
:deep(.fc-timegrid-now-indicator-line) {
  border-color: var(--el-color-primary);
}

:deep(.fc-timegrid-now-indicator-arrow) {
  border-top-color: var(--el-color-primary);
  border-bottom-color: var(--el-color-primary);
}

/* Events */
:deep(.fc-event) {
  border: none !important;
}
:deep(.fc-event-main-frame) {
  padding: var(--spacing-xs);
}
:deep(.kind-ANIMAL) {
  background: color-mix(in srgb, var(--el-color-teal-light) 25%, transparent) !important;
  backdrop-filter: blur(1px);
  &.status-PENDING {
    background: color-mix(in srgb, white 50%, transparent) !important;
    border: 0.5px solid var(--el-color-teal) !important;
  }
  & .fc-event-title {
    color: var(--el-color-teal-dark);
  }
}
:deep(.kind-INTERNAL) {
  background: color-mix(in srgb, var(--el-color-purple-light) 25%, transparent) !important;
  backdrop-filter: blur(1px);
  &.status-PENDING {
    background: color-mix(in srgb, white 50%, transparent) !important;
    border: 0.5px solid var(--el-color-purple) !important;
  }
  & .fc-event-title {
    color: var(--el-color-purple-dark);
  }
}

:deep(.fc-event-title) {
  font-weight: normal;
}
:deep(.fc-event-time) {
  color: var(--el-text-color-placeholder);
  font-size: var(--el-font-size-extra-small);
}
:deep(.fc-daygrid-event-dot) {
  display: none;
}
:deep(.fc-timegrid-event) {
  box-shadow: none !important;
  border-radius: var(--radius-sm) !important;
}

:deep(.fc-event-main) {
  padding: 0 !important;
}

/* Scrollbar */
:deep(.fc-scroller) {
  scrollbar-width: thin;
  scrollbar-color: var(--el-border-color) transparent;
}

:deep(.fc-scroller::-webkit-scrollbar) {
  width: 4px;
}

:deep(.fc-scroller::-webkit-scrollbar-thumb) {
  background: var(--el-border-color);
  border-radius: var(--radius-full);
}
</style>
