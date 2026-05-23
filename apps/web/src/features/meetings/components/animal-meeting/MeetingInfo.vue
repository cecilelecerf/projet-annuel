<script setup lang="ts">
import { computed } from 'vue'
import dayjs from 'dayjs'
import 'dayjs/locale/fr'
import type { AnimalMeetingMeta, UpdateAnimalMeeting } from '@armali/schemas'

dayjs.locale('fr')

const props = defineProps<{
  meeting: AnimalMeetingMeta
  isEditing: boolean
}>()
const edit = defineModel<UpdateAnimalMeeting>('edit', { required: true })

const dateLabel = computed(() => dayjs(props.meeting.date).format('dddd D MMMM YYYY'))
const timeLabel = computed(() => {
  const start = dayjs(props.meeting.startTime).format('H[h]mm')
  const end = dayjs(props.meeting.endTime).format('H[h]mm')
  return `${start} — ${end}`
})
</script>

<template>
  <!-- Badge + titre -->
  <div class="section title-section">
    <div class="kind-badge animal">
      <el-icon><FirstAidKit /></el-icon>
      Rendez-vous animal
    </div>
    <h1 class="meeting-title">{{ meeting.description ?? 'Consultation' }}</h1>
  </div>

  <!-- Date & Horaires -->
  <div class="section">
    <h3 class="section-label">
      <el-icon><Calendar /></el-icon> Date & Horaires
    </h3>
    <div v-if="!isEditing" class="info-row">
      <span class="info-value">{{ dateLabel }}</span>
      <span class="info-separator">·</span>
      <span class="info-value">{{ timeLabel }}</span>
    </div>
    <div v-else class="edit-time-row">
      <el-time-picker
        v-model="edit.startTime"
        format="HH:mm"
        value-format="HH:mm:ss"
        size="large"
      />
      <span class="time-arrow">→</span>
      <el-time-picker v-model="edit.endTime" format="HH:mm" value-format="HH:mm:ss" size="large" />
    </div>
  </div>

  <!-- Mesures -->
  <div class="section">
    <h3 class="section-label">
      <el-icon><DataLine /></el-icon> Mesures
    </h3>
    <div v-if="!isEditing" class="measures-row">
      <div class="measure-card">
        <span class="measure-label">Poids</span>
        <span class="measure-value">{{ meeting.petWeight ? `${meeting.petWeight} kg` : '—' }}</span>
      </div>
      <div class="measure-card">
        <span class="measure-label">Taille</span>
        <span class="measure-value">{{ meeting.petSize ? `${meeting.petSize} cm` : '—' }}</span>
      </div>
    </div>
    <div v-else class="measures-edit-row">
      <div class="measure-edit">
        <label class="edit-label">Poids (kg)</label>
        <el-input-number v-model="edit.petWeight" :precision="2" :step="0.1" size="large" />
      </div>
      <div class="measure-edit">
        <label class="edit-label">Taille (cm)</label>
        <el-input-number v-model="edit.petSize" :precision="2" :step="0.5" size="large" />
      </div>
    </div>
  </div>

  <!-- Motif -->
  <div class="section">
    <h3 class="section-label">
      <el-icon><Document /></el-icon> Motif de consultation
    </h3>
    <el-input
      v-if="isEditing"
      v-model="edit.description"
      type="textarea"
      :rows="3"
      placeholder="Décrire le motif..."
    />
    <p v-else-if="meeting.description" class="description-text">{{ meeting.description }}</p>
    <p v-else class="empty-text">Non renseigné</p>
  </div>

  <!-- Rapport -->
  <div class="section">
    <h3 class="section-label">
      <el-icon><Memo /></el-icon> Compte rendu
    </h3>
    <el-input
      v-if="isEditing"
      v-model="edit.report"
      type="textarea"
      :rows="5"
      placeholder="Rédiger le compte rendu..."
    />
    <p v-else-if="meeting.report" class="description-text">{{ meeting.report }}</p>
    <p v-else class="empty-text">Aucun compte rendu</p>
  </div>
</template>

<style lang="scss" scoped>
.meeting-title {
  font-size: 28px;
  font-weight: var(--fw-bold);
  color: var(--el-text-color-primary);
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

.description-text {
  font-size: 14px;
  color: var(--el-text-color-secondary);
  line-height: 1.6;
  margin: 0;
  white-space: pre-wrap;
}

.measures-row,
.measures-edit-row {
  display: flex;
  gap: var(--spacing-md);
}

.measure-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: var(--spacing-md);
  background: var(--el-fill-color-light);
  border-radius: var(--radius-md);
  text-align: center;
}

.measure-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.measure-value {
  font-size: 22px;
  font-weight: var(--fw-bold);
  color: var(--el-text-color-primary);
}

.measure-edit {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.edit-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
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
.kind-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: var(--radius-full);
  font-size: 12px;
  font-weight: var(--fw-semibold);
  width: fit-content;

  &.animal {
    background: var(--el-color-success-light-9);
    color: var(--el-color-success);
    border: 1px solid var(--el-color-success-light-5);
  }
}
</style>
