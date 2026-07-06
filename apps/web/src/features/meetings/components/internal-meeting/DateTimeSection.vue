<script setup lang="ts">
import { Calendar } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import { computed } from 'vue'

const { date } = defineProps<{
  editing: boolean
  date: Date
  timeLabel: string
}>()

const startTime = defineModel<string>('startTime', { required: true })
const endTime = defineModel<string>('endTime', { required: true })

// Capturé une seule fois à la création du composant, avant toute édition —
// sert de référence fixe pour savoir si le RDV a réellement déjà commencé,
// indépendamment de ce que l'utilisateur tape ensuite dans le time-picker
const initialStartTime = startTime.value

const isPast = computed(() => {
  if (!initialStartTime) return false
  const [hoursStr, minutesStr] = initialStartTime.split(':')
  const hours = Number(hoursStr ?? 0)
  const minutes = Number(minutesStr ?? 0)
  const meetingDateTime = dayjs(date).hour(hours).minute(minutes).second(0).millisecond(0)
  return meetingDateTime.isBefore(dayjs())
})

const dateLabel = computed(() => dayjs(date).format('dddd D MMMM YYYY'))
const canEditSchedule = computed(() => !isPast.value)
</script>

<template>
  <div class="section">
    <h3 class="section-label">
      <el-icon><Calendar /></el-icon>
      Date & Horaires
    </h3>
    <div v-if="!editing || !canEditSchedule" class="info-row">
      <span class="info-value">{{ dateLabel }}</span>
      <span class="info-separator">·</span>
      <span class="info-value">{{ timeLabel }}</span>
    </div>
    <div v-else class="edit-time-row">
      <el-time-picker
        v-model="startTime"
        format="HH:mm"
        placeholder="Début"
        size="large"
        value-format="HH:mm:ss"
      />
      <span class="time-arrow">→</span>
      <el-time-picker
        v-model="endTime"
        format="HH:mm"
        placeholder="Fin"
        size="large"
        value-format="HH:mm:ss"
      />
    </div>
  </div>
</template>

<style scoped>
.section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.section-label {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: 13px;
  font-weight: var(--fw-semibold);
  color: var(--el-text-color-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0;
}

.info-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.info-value {
  font-size: 15px;
  color: var(--el-text-color-primary);
}

.info-separator {
  color: var(--el-text-color-placeholder);
}

.edit-time-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.time-arrow {
  color: var(--el-text-color-placeholder);
  font-size: 16px;
}
</style>
