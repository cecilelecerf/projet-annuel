<script setup lang="ts">
import { Delete, Edit, Clock, Calendar, Refresh } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import 'dayjs/locale/fr'
import type { AvailabilityRecurringResponse, AvailabilityId, ClinicId } from '@armali/schemas'
import { DAYS } from '../types/availabilty'
import { formatDate, formatTime } from '@/features/meetings/components/utils'

dayjs.extend(utc)
dayjs.locale('fr')

const { recurring } = defineProps<{
  recurring: AvailabilityRecurringResponse[]
  deleting: AvailabilityId | null
}>()

const emit = defineEmits<{
  edit: [avail: AvailabilityRecurringResponse]
  remove: [id: AvailabilityId]
  create: []
}>()

const groupByClinic: Record<
  ClinicId,
  { clinicName: string; recurring: AvailabilityRecurringResponse[] }
> = recurring.reduce(
  (
    acc: Record<ClinicId, { clinicName: string; recurring: AvailabilityRecurringResponse[] }>,
    rec,
  ) => {
    const existing = acc[rec.clinicId]?.recurring ?? []
    return {
      ...acc,
      [rec.clinicId]: { clinicName: rec.clinic.name, recurring: [...existing, rec] },
    }
  },
  {} as Record<ClinicId, { clinicName: string; recurring: AvailabilityRecurringResponse[] }>,
)
</script>

<template>
  <div class="card">
    <div class="block-label">
      <el-icon><Refresh /></el-icon>
      Récurrences
      <span class="count-badge">{{ recurring.length }}</span>
    </div>

    <div v-if="recurring.length === 0" class="empty-state">
      <el-icon class="empty-icon"><Refresh /></el-icon>
      <p>Aucune récurrence définie</p>
      <el-button size="small" type="primary" @click="emit('create')">
        Ajouter une récurrence
      </el-button>
    </div>
    <div v-else class="clinic-list">
      <div class="avail-list" v-for="value in groupByClinic" :key="value.clinicName">
        <p class="clinic-name">{{ value.clinicName }}</p>
        <div v-for="avail in value.recurring" :key="avail.id" class="avail-card">
          <div class="avail-days">
            <span
              v-for="day in DAYS"
              :key="day.value"
              class="day-chip"
              :class="{ 'day-chip--active': avail.recurring.dayOfWeek.includes(day.value) }"
            >
              {{ day.label }}
            </span>
          </div>

          <div class="avail-info">
            <div class="avail-time">
              <el-icon><Clock /></el-icon>
              {{ formatTime(avail.recurring.startTime) }} —
              {{ formatTime(avail.recurring.endTime) }}
            </div>
            <div class="avail-period">
              <el-icon><Calendar /></el-icon>
              Du {{ formatDate(avail.recurring.dateStart) }} au
              {{ formatDate(avail.recurring.dateEnd) }}
            </div>
          </div>

          <div class="avail-actions">
            <el-button :icon="Edit" circle size="small" @click="emit('edit', avail)" />
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
.clinic-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}
.clinic-name {
  color: var(--el-text-color-secondary);
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
}

.avail-days {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.day-chip {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-full);
  font-size: 11px;
  font-weight: var(--fw-semibold);
  background: var(--el-fill-color-light);
  color: var(--el-text-color-placeholder);
  border: 1px solid var(--el-border-color-lighter);

  &--active {
    background: var(--el-color-primary-light-9);
    color: var(--el-color-primary);
    border-color: var(--el-color-primary-light-5);
  }
}

.avail-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.avail-time {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  font-weight: var(--fw-semibold);
  color: var(--el-text-color-primary);

  .el-icon {
    font-size: 13px;
    color: var(--el-text-color-placeholder);
  }
}

.avail-period {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--el-text-color-secondary);

  .el-icon {
    font-size: 12px;
    color: var(--el-text-color-placeholder);
  }
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
