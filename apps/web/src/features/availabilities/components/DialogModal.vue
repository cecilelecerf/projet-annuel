<script setup lang="ts">
import { Calendar, Refresh } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import 'dayjs/locale/fr'
import { DAYS, type AvailabilityForm } from '../types/availabilty'
import { formatDate } from '@/features/meetings/components/utils'

dayjs.locale('fr')

const props = defineProps<{
  saving: boolean
  isEditing: boolean
}>()

const form = defineModel<AvailabilityForm>('form', { required: true })
const show = defineModel<boolean>('show', { required: true })

const emit = defineEmits<{
  save: []
}>()

function toggleDay(value: number) {
  if (form.value.dayOfWeek.includes(value)) {
    form.value.dayOfWeek = form.value.dayOfWeek.filter((d) => d !== value)
  } else {
    form.value.dayOfWeek.push(value)
  }
}

const dialogTitle = props.isEditing
  ? 'Modifier la disponibilité'
  : form.value.kind === 'RECURRING'
    ? 'Ajouter une récurrence'
    : 'Ajouter une date ponctuelle'
</script>

<template>
  <el-dialog
    v-model="show"
    :title="dialogTitle"
    width="480px"
    align-center
    :close-on-click-modal="!saving"
    :show-close="!saving"
  >
    <div class="dialog-form">
      <!-- Toggle type — uniquement à la création -->
      <div v-if="!isEditing" class="type-toggle">
        <button
          class="type-btn"
          :class="{ 'type-btn--active': form.kind === 'RECURRING' }"
          @click="form.kind = 'RECURRING'"
        >
          <el-icon><Refresh /></el-icon>
          Récurrence
        </button>
        <button
          class="type-btn"
          :class="{ 'type-btn--active': form.kind === 'PUNCTUAL' }"
          @click="form.kind = 'PUNCTUAL'"
        >
          <el-icon><Calendar /></el-icon>
          Date ponctuelle
        </button>
      </div>

      <!-- Récurrence -->
      <template v-if="form.kind === 'RECURRING'">
        <div class="form-group">
          <label class="form-label">Jours de la semaine</label>
          <div class="days-picker">
            <button
              v-for="day in DAYS"
              :key="day.value"
              class="day-btn"
              :class="{ 'day-btn--active': form.dayOfWeek.includes(day.value) }"
              @click="toggleDay(day.value)"
            >
              {{ day.label }}
            </button>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Période — début</label>
            <el-date-picker
              v-model="form.dateStart"
              type="date"
              value-format="YYYY-MM-DD"
              placeholder="Date de début"
              style="width: 100%"
            />
          </div>
          <div class="form-group">
            <label class="form-label">Période — fin</label>
            <el-date-picker
              v-model="form.dateEnd"
              type="date"
              value-format="YYYY-MM-DD"
              placeholder="Date de fin"
              style="width: 100%"
            />
          </div>
        </div>
      </template>

      <!-- Ponctuelle -->
      <template v-else>
        <div class="form-group">
          <label class="form-label">Date</label>
          <el-date-picker
            v-model="form.date"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="Sélectionner une date"
            style="width: 100%"
            :disabled-date="(date: Date) => date < new Date()"
          />
        </div>
      </template>

      <!-- Horaires (commun) -->
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Heure de début</label>
          <el-time-select
            v-model="form.startTime"
            start="06:00"
            end="22:00"
            step="00:15"
            placeholder="Début"
            style="width: 100%"
          />
        </div>
        <div class="form-group">
          <label class="form-label">Heure de fin</label>
          <el-time-select
            v-model="form.endTime"
            :start="form.startTime || '06:15'"
            end="22:00"
            step="00:15"
            placeholder="Fin"
            style="width: 100%"
          />
        </div>
      </div>

      <!-- Aperçu -->
      <div v-if="form.startTime && form.endTime" class="preview">
        <template v-if="form.kind === 'RECURRING' && form.dayOfWeek.length > 0">
          <el-icon><Refresh /></el-icon>
          {{
            DAYS.filter((d) => form.dayOfWeek.includes(d.value))
              .map((d) => d.label)
              .join(', ')
          }}
          de {{ form.startTime.replace(':', 'h') }} à {{ form.endTime.replace(':', 'h') }}
          <template v-if="form.dateStart && form.dateEnd">
            · du {{ formatDate(new Date(form.dateStart)) }} au
            {{ formatDate(new Date(form.dateEnd)) }}
          </template>
        </template>
        <template v-else-if="form.kind === 'PUNCTUAL' && form.date">
          <el-icon><Calendar /></el-icon>
          {{ formatDate(new Date(form.date)) }}
          de {{ form.startTime.replace(':', 'h') }} à {{ form.endTime.replace(':', 'h') }}
        </template>
      </div>
    </div>

    <template #footer>
      <el-button :disabled="saving" @click="show = false">Annuler</el-button>
      <el-button type="primary" :loading="saving" @click="emit('save')">
        {{ isEditing ? 'Enregistrer' : 'Ajouter' }}
      </el-button>
    </template>
  </el-dialog>
</template>

<style scoped lang="scss">
.dialog-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.type-toggle {
  display: flex;
  gap: var(--spacing-xs);
  background: var(--el-fill-color-light);
  border-radius: var(--radius-full);
  padding: 4px;
}

.type-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-md);
  border-radius: var(--radius-full);
  border: none;
  background: transparent;
  cursor: pointer;
  font-family: 'DM Sans', sans-serif;
  font-size: 13px;
  font-weight: var(--fw-medium);
  color: var(--el-text-color-secondary);
  transition: all 0.15s;

  &--active {
    background: var(--el-bg-color);
    color: var(--el-color-primary);
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  }
}

.form-row {
  display: flex;
  gap: var(--spacing-md);

  .form-group {
    flex: 1;
  }
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.form-label {
  font-size: 12px;
  font-weight: var(--fw-medium);
  color: var(--el-text-color-secondary);
}

.days-picker {
  display: flex;
  gap: var(--spacing-xs);
}

.day-btn {
  flex: 1;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-full);
  border: 1px solid var(--el-border-color-lighter);
  background: var(--el-fill-color-light);
  cursor: pointer;
  font-family: 'DM Sans', sans-serif;
  font-size: 12px;
  font-weight: var(--fw-semibold);
  color: var(--el-text-color-secondary);
  transition: all 0.15s;

  &:hover {
    border-color: var(--el-color-primary-light-5);
    color: var(--el-color-primary);
  }

  &--active {
    background: var(--el-color-primary-light-9);
    border-color: var(--el-color-primary);
    color: var(--el-color-primary);
  }
}

.preview {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--el-color-primary-light-9);
  border: 1px solid var(--el-color-primary-light-7);
  border-radius: var(--radius-md);
  font-size: 13px;
  color: var(--el-color-primary);
  font-weight: var(--fw-medium);

  .el-icon {
    flex-shrink: 0;
  }
}
</style>
