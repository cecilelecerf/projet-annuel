<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import dayjs from 'dayjs'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { Edit, RefreshRight, InfoFilled, Calendar, Clock } from '@element-plus/icons-vue'
import { type MeetingRecurring, type MeetingRecurringId } from '@armali/schemas'
import { calendarApi } from '../api/calendar.api'

const props = defineProps<{
  recurringId: MeetingRecurringId
}>()

const DAYS = [
  { label: 'Dimanche', short: 'Dim', value: 0 },
  { label: 'Lundi', short: 'Lun', value: 1 },
  { label: 'Mardi', short: 'Mar', value: 2 },
  { label: 'Mercredi', short: 'Mer', value: 3 },
  { label: 'Jeudi', short: 'Jeu', value: 4 },
  { label: 'Vendredi', short: 'Ven', value: 5 },
  { label: 'Samedi', short: 'Sam', value: 6 },
]

const loading = ref(true)
const error = ref(false)
const editing = ref(false)
const saving = ref(false)
const meeting = ref<MeetingRecurring | null>(null)
const formRef = ref<FormInstance>()

const form = reactive({
  dayOfWeek: [1] as number[],
  startTime: '08:00',
  endTime: '12:00',
  dateRange: [null, null] as [string | null, string | null],
})

const rules: FormRules = {
  dayOfWeek: [{ required: true, message: 'Sélectionne au moins un jour', trigger: 'change' }],
  startTime: [{ required: true, message: 'Heure de début requise', trigger: 'change' }],
  endTime: [
    { required: true, message: 'Heure de fin requise', trigger: 'change' },
    {
      validator: (_rule, value, callback) => {
        if (value && form.startTime && value <= form.startTime) {
          callback(new Error("L'heure de fin doit être après l'heure de début"))
        } else {
          callback()
        }
      },
      trigger: 'change',
    },
  ],
}

async function fetchMeeting() {
  loading.value = true
  error.value = false
  try {
    meeting.value = await calendarApi.recurring.get(props.recurringId)
  } catch {
    error.value = true
  } finally {
    loading.value = false
  }
}

watch(() => props.recurringId, fetchMeeting, { immediate: true })

function startEditing() {
  if (!meeting.value) return
  form.dayOfWeek = meeting.value.dayOfWeek ?? [1]
  form.startTime = meeting.value.startTime
    ? dayjs(meeting.value.startTime).format('HH:mm')
    : '08:00'
  form.endTime = meeting.value.endTime ? dayjs(meeting.value.endTime).format('HH:mm') : '12:00'
  form.dateRange = [
    meeting.value.dateStart ? dayjs(meeting.value.dateStart).format('YYYY-MM-DD') : null,
    meeting.value.dateEnd ? dayjs(meeting.value.dateEnd).format('YYYY-MM-DD') : null,
  ]
  editing.value = true
}

function cancelEditing() {
  formRef.value?.clearValidate()
  editing.value = false
}

async function save() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  saving.value = true
  try {
    await calendarApi.recurring.update(props.recurringId, {
      dayOfWeek: form.dayOfWeek,
      startTime: dayjs(`1970-01-01T${form.startTime}`).toDate(),
      endTime: dayjs(`1970-01-01T${form.endTime}`).toDate(),
      dateStart: form.dateRange[0] ? new Date(form.dateRange[0]) : undefined,
      dateEnd: form.dateRange[1] ? new Date(form.dateRange[1]) : undefined,
    })
    await fetchMeeting()
    editing.value = false
    ElMessage.success('Récurrence mise à jour')
  } catch {
    ElMessage.error('Erreur lors de la mise à jour')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="recurring-card">
    <header class="card-header">
      <div class="header-title">
        <span class="icon-badge"
          ><el-icon><RefreshRight /></el-icon
        ></span>
        <h3>Récurrence</h3>
      </div>
      <el-button v-if="!editing && meeting" link :icon="Edit" @click="startEditing">
        Modifier
      </el-button>
    </header>

    <el-skeleton v-if="loading" :rows="2" animated style="padding: 0 4px" />

    <el-alert
      v-else-if="error"
      type="error"
      :closable="false"
      show-icon
      title="Impossible de charger la récurrence"
    >
      <el-button size="small" @click="fetchMeeting">Réessayer</el-button>
    </el-alert>

    <p v-else-if="!meeting" class="empty-state">Aucune récurrence configurée.</p>

    <div v-else-if="!editing" class="summary">
      <div class="day-chips">
        <span
          v-for="d in DAYS"
          :key="d.value"
          class="day-chip"
          :class="{ active: meeting.dayOfWeek?.includes(d.value) }"
        >
          {{ d.short }}
        </span>
      </div>

      <div class="summary-row">
        <el-icon class="row-icon"><Clock /></el-icon>
        <span
          >{{ dayjs(meeting.startTime).format('HH:mm') }} –
          {{ dayjs(meeting.endTime).format('HH:mm') }}</span
        >
      </div>

      <div v-if="meeting.dateStart || meeting.dateEnd" class="summary-row">
        <el-icon class="row-icon"><Calendar /></el-icon>
        <span>
          Du {{ meeting.dateStart ? dayjs(meeting.dateStart).format('DD/MM/YYYY') : '…' }} au
          {{ meeting.dateEnd ? dayjs(meeting.dateEnd).format('DD/MM/YYYY') : '…' }}
        </span>
      </div>
    </div>

    <el-form
      v-else
      ref="formRef"
      :model="form"
      :rules="rules"
      label-position="top"
      size="default"
      class="edit-form"
    >
      <div class="notice">
        <el-icon class="notice-icon"><InfoFilled /></el-icon>
        <span
          >Cette modification ne s'appliquera qu'aux occurrences futures. L'historique passé reste
          inchangé.</span
        >
      </div>

      <el-form-item label="Jours de la semaine" prop="dayOfWeek">
        <el-select
          v-model="form.dayOfWeek"
          multiple
          placeholder="Sélectionne un ou plusieurs jours"
          style="width: 100%"
        >
          <el-option v-for="d in DAYS" :key="d.value" :label="d.label" :value="d.value" />
        </el-select>
      </el-form-item>

      <el-form-item label="Horaires" prop="endTime">
        <div class="time-range">
          <el-time-select
            v-model="form.startTime"
            start="06:00"
            end="22:00"
            step="00:15"
            placeholder="Début"
          />
          <span class="time-separator">à</span>
          <el-time-select
            v-model="form.endTime"
            start="06:00"
            end="22:00"
            step="00:15"
            placeholder="Fin"
          />
        </div>
      </el-form-item>

      <el-form-item label="Période de validité">
        <el-date-picker
          v-model="form.dateRange"
          type="daterange"
          value-format="YYYY-MM-DD"
          start-placeholder="Début"
          end-placeholder="Fin"
          style="width: 100%"
        />
      </el-form-item>

      <div class="form-actions">
        <el-button @click="cancelEditing">Annuler</el-button>
        <el-button type="primary" :loading="saving" @click="save">Enregistrer</el-button>
      </div>
    </el-form>
  </div>
</template>

<style scoped>
.recurring-card {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  padding: var(--spacing-lg);
  border-radius: var(--radius-lg);
  border: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-title {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.header-title h3 {
  font-family: 'Nunito', sans-serif;
  font-weight: var(--fw-bold);
  font-size: var(--el-font-size-medium);
  color: var(--el-text-color-primary);
  margin: 0;
}

.icon-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: var(--radius-md);
  background: color-mix(in srgb, var(--el-color-primary) 12%, transparent);
  color: var(--el-color-primary);
  font-size: 15px;
}

.empty-state {
  font-size: var(--el-font-size-base);
  color: var(--el-text-color-placeholder);
  font-style: italic;
  margin: 0;
}

/* ── Summary view ────────────────────────────────────────── */
.summary {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.day-chips {
  display: flex;
  gap: 6px;
}

.day-chip {
  flex: 1;
  text-align: center;
  padding: 6px 0;
  border-radius: var(--radius-md);
  font-size: 12px;
  font-weight: var(--fw-bold);
  color: var(--el-text-color-placeholder);
  background: var(--el-fill-color-light);
  text-transform: uppercase;
  letter-spacing: 0.03em;
  transition: all 0.15s;
}

.day-chip.active {
  background: var(--el-color-primary);
  color: white;
}

.summary-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-family: 'DM Sans', sans-serif;
  font-size: var(--el-font-size-base);
  color: var(--el-text-color-regular);
}

.row-icon {
  color: var(--el-text-color-placeholder);
  font-size: 15px;
}

/* ── Edit form ───────────────────────────────────────────── */
.edit-form {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.notice {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-md);
  background: color-mix(in srgb, var(--el-color-primary) 8%, transparent);
  font-family: 'DM Sans', sans-serif;
  font-size: var(--el-font-size-small);
  color: var(--el-text-color-regular);
  margin-bottom: var(--spacing-sm);
}

.notice-icon {
  flex-shrink: 0;
  margin-top: 2px;
  color: var(--el-color-primary);
}

.time-range {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  width: 100%;
}

.time-range :deep(.el-select) {
  flex: 1;
}

.time-separator {
  color: var(--el-text-color-placeholder);
  font-size: var(--el-font-size-small);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-sm);
}
</style>
