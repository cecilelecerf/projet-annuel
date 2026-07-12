<script setup lang="ts">
import { computed } from 'vue'
import { DAY_LABELS, orderedByWeekday, type OpeningHoursDay } from '@/utils/clinic.utils'

const model = defineModel<OpeningHoursDay[]>({ required: true })

const rows = computed(() => orderedByWeekday(model.value))
</script>

<template>
  <div class="opening-hours">
    <div v-for="day in rows" :key="day.dayOfWeek" class="day-row">
      <span class="day-label">{{ DAY_LABELS[day.dayOfWeek] }}</span>
      <el-checkbox v-model="day.closed">Fermé</el-checkbox>
      <template v-if="!day.closed">
        <el-time-select
          v-model="day.openTime"
          start="00:00"
          step="00:30"
          end="23:30"
          placeholder="Ouverture"
          class="time-select"
        />
        <span class="separator">→</span>
        <el-time-select
          v-model="day.closeTime"
          start="00:00"
          step="00:30"
          end="23:30"
          placeholder="Fermeture"
          class="time-select"
        />
      </template>
      <span v-else class="closed-label">—</span>
    </div>
  </div>
</template>

<style scoped>
.opening-hours {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.day-row {
  display: flex;
  align-items: center;
  gap: 12px;
}
.day-label {
  width: 90px;
  flex-shrink: 0;
  font-size: 14px;
  font-weight: 500;
  color: #1a1a1a;
}
.time-select {
  width: 130px;
}
.separator {
  color: #9ca3af;
}
.closed-label {
  color: #9ca3af;
}
</style>
