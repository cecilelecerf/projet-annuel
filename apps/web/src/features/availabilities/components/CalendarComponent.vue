<script setup lang="ts">
import FullCalendar from '@fullcalendar/vue3'
import { Calendar } from '@element-plus/icons-vue'
import type { AvailabilityResponse } from '@armali/schemas'
import { useAvailabilityCalendar } from '../composables/useCalendar'
import { toRef } from 'vue'

const props = defineProps<{
  availabilities: AvailabilityResponse[]
}>()

const { calendarOptions, clinicColorList } = useAvailabilityCalendar(toRef(props, 'availabilities'))
</script>

<template>
  <div class="block">
    <div class="block-label">
      <el-icon><Calendar /></el-icon>
      Aperçu de la semaine
    </div>
    <div class="calendar-wrap">
      <div class="calendar-legend">
        <span
          v-for="entry in clinicColorList"
          :key="entry.clinicId"
          class="legend-item"
          :style="{
            '--legend-bg': `var(--el-color-${entry.color}-light-7)`,
            '--legend-border': `var(--el-color-${entry.color})`,
          }"
        >
          {{ entry.clinicName }}
        </span>
        <span v-if="clinicColorList.length === 0" class="legend-empty">
          Aucune clinique à afficher
        </span>
      </div>
      <FullCalendar :options="calendarOptions" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.block {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.block-label {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: 11px;
  font-weight: var(--fw-semibold);
  color: var(--el-text-color-secondary);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding-bottom: var(--spacing-sm);
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.calendar-wrap {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--radius-lg);
  overflow: hidden;
  background: var(--el-bg-color);
}

.calendar-legend {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-md);
  padding: var(--spacing-sm) var(--spacing-md);
  border-bottom: 1px solid var(--el-border-color-lighter);
  background: var(--el-fill-color-extra-light);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--el-text-color-secondary);

  &::before {
    content: '';
    width: 12px;
    height: 12px;
    border-radius: 3px;
    flex-shrink: 0;
    background: var(--legend-bg);
    border: 1.5px solid var(--legend-border);
  }
}

.legend-empty {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
  font-style: italic;
}

:deep(.fc) {
  font-family: 'DM Sans', sans-serif;
  font-size: 13px;
}

:deep(.fc-toolbar-title) {
  font-family: 'Nunito', sans-serif;
  font-size: 15px;
  font-weight: var(--fw-bold);
  color: var(--el-text-color-primary);
  text-transform: capitalize;
}

:deep(.fc-toolbar) {
  padding: var(--spacing-sm) var(--spacing-md);
  margin-bottom: 0 !important;
}

:deep(.fc-button) {
  background: transparent !important;
  border: none !important;
  color: var(--el-text-color-secondary) !important;
  box-shadow: none !important;
  padding: 4px 8px !important;
  border-radius: var(--radius-full) !important;
  transition: background 0.15s !important;

  &:hover {
    background: var(--el-fill-color) !important;
    color: var(--el-text-color-primary) !important;
  }

  &:focus {
    box-shadow: none !important;
  }
}

:deep(.fc-col-header-cell-cushion) {
  font-size: 11px;
  font-weight: var(--fw-semibold);
  color: var(--el-text-color-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  text-decoration: none;
  padding: var(--spacing-xs) 0;
}

:deep(.fc-timegrid-slot-label) {
  font-size: 11px;
  color: var(--el-text-color-placeholder);
  font-weight: var(--fw-medium);
}

:deep(.fc-timegrid-slot) {
  height: 17px !important;
}

:deep(.fc-timegrid-slot-minor) {
  border-top-style: dashed !important;
  border-color: var(--el-border-color-extra-light) !important;
}

:deep(.fc-day-today) {
  background: var(--el-color-primary-light-9) !important;
}

:deep(.fc-col-header-cell) {
  background: var(--el-fill-color-extra-light);
}

:deep(.fc-event) {
  border-radius: var(--radius-md) !important;
  font-size: 11px !important;
  font-weight: var(--fw-medium) !important;
  border-width: 1.5px !important;
  padding: 2px 6px !important;
}

:deep(.fc-timegrid-now-indicator-line) {
  border-color: var(--el-color-danger) !important;
  border-width: 2px !important;
}

:deep(.fc-timegrid-now-indicator-arrow) {
  border-top-color: var(--el-color-danger) !important;
  border-bottom-color: var(--el-color-danger) !important;
}

:deep(.fc-scrollgrid) {
  border-color: var(--el-border-color-lighter) !important;
}

:deep(.fc-scrollgrid td),
:deep(.fc-scrollgrid th) {
  border-color: var(--el-border-color-lighter) !important;
}
</style>
