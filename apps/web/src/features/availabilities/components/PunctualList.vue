<script setup lang="ts">
import { Delete, Edit, Clock, Calendar } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import 'dayjs/locale/fr'
import type { AvailabilityPunctualResponse, AvailabilityId } from '@armali/schemas'
import { formatDate, formatTime } from '@/features/meetings/components/utils'

dayjs.extend(utc)
dayjs.locale('fr')

defineProps<{
  punctual: AvailabilityPunctualResponse[]
  deleting: AvailabilityId | null
}>()

const emit = defineEmits<{
  edit: [avail: AvailabilityPunctualResponse]
  remove: [id: AvailabilityId]
  create: []
}>()

function isPast(date: Date | string) {
  return dayjs(date).isBefore(dayjs(), 'day')
}
</script>

<template>
  <div class="card">
    <div class="block-label">
      <el-icon><Calendar /></el-icon>
      Dates ponctuelles
      <span class="count-badge">{{ punctual.length }}</span>
    </div>

    <div v-if="punctual.length === 0" class="empty-state">
      <el-icon class="empty-icon"><Calendar /></el-icon>
      <p>Aucune date ponctuelle définie</p>
      <el-button size="small" type="primary" @click="emit('create')"> Ajouter une date </el-button>
    </div>

    <div v-else class="avail-list">
      <div
        v-for="avail in punctual"
        :key="avail.id"
        class="avail-card"
        :class="{ 'avail-card--past': isPast(avail.meeting.date) }"
      >
        <div class="avail-date-block">
          <span class="date-day">{{ dayjs(avail.meeting.date).format('D') }}</span>
          <span class="date-month">{{ dayjs(avail.meeting.date).format('MMM') }}</span>
        </div>

        <div class="avail-info">
          <div class="avail-date-label">{{ formatDate(avail.meeting.date) }}</div>
          <div class="avail-time">
            <el-icon><Clock /></el-icon>
            {{ formatTime(avail.meeting.startTime) }} —
            {{ formatTime(avail.meeting.endTime) }}
          </div>
        </div>

        <div class="avail-right">
          <el-tag v-if="isPast(avail.meeting.date)" type="info" size="small" round> Passée </el-tag>
          <div class="avail-actions">
            <el-button
              :icon="Edit"
              circle
              size="small"
              :disabled="isPast(avail.meeting.date)"
              @click="emit('edit', avail)"
            />
            <el-button
              :icon="Delete"
              circle
              size="small"
              type="danger"
              plain
              :loading="deleting === avail.id"
              @click="emit('remove', avail.id)"
            />
          </div>
        </div>
      </div>
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
  padding-bottom: var(--spacing-md);
}

.count-badge {
  background: var(--el-fill-color);
  border-radius: var(--radius-full);
  padding: 1px 7px;
  font-size: 11px;
  font-weight: var(--fw-regular);
  color: var(--el-text-color-secondary);
  text-transform: none;
  letter-spacing: 0;
}

.avail-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.avail-card {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md) var(--spacing-lg);
  border-radius: var(--radius-lg);
  border: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
  transition: border-color 0.15s;

  &:hover {
    border-color: var(--el-color-primary-light-5);
  }

  &--past {
    opacity: 0.65;
  }
}

.avail-date-block {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-md);
  background: var(--el-color-primary-light-9);
  border: 1px solid var(--el-color-primary-light-7);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  .avail-card--past & {
    background: var(--el-fill-color-light);
    border-color: var(--el-border-color-lighter);
  }
}

.date-day {
  font-family: 'Nunito', sans-serif;
  font-size: 18px;
  font-weight: var(--fw-bold);
  line-height: 1;
  color: var(--el-color-primary);

  .avail-card--past & {
    color: var(--el-text-color-secondary);
  }
}

.date-month {
  font-size: 10px;
  font-weight: var(--fw-semibold);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--el-color-primary-light-3);

  .avail-card--past & {
    color: var(--el-text-color-placeholder);
  }
}

.avail-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.avail-date-label {
  font-size: 14px;
  font-weight: var(--fw-semibold);
  color: var(--el-text-color-primary);
}

.avail-time {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: var(--el-text-color-secondary);

  .el-icon {
    font-size: 12px;
    color: var(--el-text-color-placeholder);
  }
}

.avail-right {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.avail-actions {
  display: flex;
  gap: var(--spacing-xs);
  flex-shrink: 0;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-2xl) var(--spacing-xl);
  border: 1px dashed var(--el-border-color);
  border-radius: var(--radius-lg);
  text-align: center;

  p {
    font-size: 13px;
    color: var(--el-text-color-secondary);
    margin: 0;
  }
}

.empty-icon {
  font-size: 28px;
  color: var(--el-color-primary-light-5);
}
</style>
