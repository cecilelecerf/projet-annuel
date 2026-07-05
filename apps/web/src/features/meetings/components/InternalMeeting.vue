<script setup lang="ts">
import type { InternalMeetingMeta } from '@armali/schemas'
import dayjs from 'dayjs'
import 'dayjs/locale/fr'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import { calendarApi } from '../api/calendar.api'
import { useFormErrorStore } from '@/stores/formErrorStore'

dayjs.locale('fr')

const { meeting } = defineProps<{
  meeting: InternalMeetingMeta
}>()
const router = useRouter()
const formErrorStore = useFormErrorStore()

const isEditing = ref(false)
const editTitle = ref(meeting.title)
const editDescription = ref(meeting.description ?? '')
const editStart = ref(dayjs(meeting.startTime).format('HH:mm:ss'))
const editEnd = ref(dayjs(meeting.endTime).format('HH:mm:ss'))

const dateLabel = computed(() => dayjs(meeting.date).format('dddd D MMMM YYYY'))

const timeLabel = computed(() => {
  const start = dayjs(meeting.startTime).format('H[h]mm')
  const end = dayjs(meeting.endTime).format('H[h]mm')
  return `${start} — ${end}`
})

const statusColor = (status: string) => {
  if (status === 'ACCEPTED') return 'success'
  if (status === 'DECLINED') return 'danger'
  return 'warning'
}

const statusLabel = (status: string) => {
  if (status === 'ACCEPTED') return 'Accepté'
  if (status === 'DECLINED') return 'Refusé'
  return 'En attente'
}

const onSave = async () => {
  try {
    await calendarApi.internal.update(meeting.id, {
      title: editTitle.value,
      description: editDescription.value,
      startTime: new Date(`1970-01-01T${editStart.value}`),
      endTime: new Date(`1970-01-01T${editEnd.value}`),
    })
    isEditing.value = false
  } catch (err) {
    formErrorStore.handle(err)
  }
}

const onDelete = async () => {
  try {
    await ElMessageBox.confirm('Cette action est irréversible.', 'Supprimer la réunion ?', {
      confirmButtonText: 'Supprimer',
      cancelButtonText: 'Annuler',
      type: 'warning',
    })
  } catch {
    return
  }

  try {
    await calendarApi.delete(meeting.id)
    router.back()
  } catch (err) {
    formErrorStore.handle(err)
  }
}
</script>

<template>
  <!-- Header -->
  <div class="page-header">
    <el-button text @click="router.back()">
      <el-icon><ArrowLeft /></el-icon>
      Retour
    </el-button>

    <div class="header-actions">
      <el-button v-if="!isEditing" @click="isEditing = true">
        <el-icon><Edit /></el-icon>
        Modifier
      </el-button>
      <el-button v-if="isEditing" type="primary" @click="onSave">
        <el-icon><Check /></el-icon>
        Enregistrer
      </el-button>
      <el-button v-if="isEditing" @click="isEditing = false">Annuler</el-button>
      <el-button type="danger" plain @click="onDelete">
        <el-icon><Delete /></el-icon>
        Supprimer
      </el-button>
    </div>
  </div>

  <div class="meeting-content">
    <!-- Titre -->
    <div class="section title-section">
      <div class="kind-badge internal">
        <el-icon><ChatDotRound /></el-icon>
        Réunion interne
      </div>
      <el-input v-if="isEditing" v-model="editTitle" size="large" class="title-input" />
      <h1 v-else class="meeting-title">{{ meeting.title }}</h1>
    </div>

    <!-- Date & Horaires -->
    <div class="section">
      <h3 class="section-label">
        <el-icon><Calendar /></el-icon>
        Date & Horaires
      </h3>
      <div v-if="!isEditing" class="info-row">
        <span class="info-value">{{ dateLabel }}</span>
        <span class="info-separator">·</span>
        <span class="info-value">{{ timeLabel }}</span>
      </div>
      <div v-else class="edit-time-row">
        <el-time-picker
          v-model="editStart"
          format="HH:mm"
          value-format="HH:mm:ss"
          placeholder="Début"
          size="large"
        />
        <span class="time-arrow">→</span>
        <el-time-picker
          v-model="editEnd"
          format="HH:mm"
          value-format="HH:mm:ss"
          placeholder="Fin"
          size="large"
        />
      </div>
    </div>

    <!-- Description -->
    <div class="section">
      <h3 class="section-label">
        <el-icon><Document /></el-icon>
        Description
      </h3>
      <el-input
        v-if="isEditing"
        v-model="editDescription"
        type="textarea"
        :rows="3"
        placeholder="Ajouter une description..."
      />
      <p v-else-if="meeting.description" class="description-text">
        {{ meeting.description }}
      </p>
      <p v-else class="empty-text">Aucune description</p>
    </div>

    <!-- Participants -->
    <div class="section">
      <h3 class="section-label">
        <el-icon><User /></el-icon>
        Participants
        <span class="count-badge">{{ meeting.participants?.length ?? 0 }}</span>
      </h3>

      <div class="participants-list">
        <div v-for="p in meeting.participants" :key="p.id" class="participant-row">
          <el-avatar :size="36" class="participant-avatar">
            {{ p.user?.firstname?.charAt(0) ?? '?' }}
          </el-avatar>
          <div class="participant-info">
            <span class="participant-name"> {{ p.user?.firstname }} {{ p.user?.lastname }} </span>
            <span class="participant-role">{{ p.user?.role }}</span>
          </div>
          <el-tag :type="statusColor(p.status)" size="small" round>
            {{ statusLabel(p.status) }}
          </el-tag>
        </div>
      </div>
    </div>

    <!-- Récurrence -->
    <div v-if="meeting.recurringId" class="section">
      <h3 class="section-label">
        <el-icon><RefreshRight /></el-icon>
        Récurrence
      </h3>
      <p class="info-value">Réunion récurrente</p>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-xl);
}

.header-actions {
  display: flex;
  gap: var(--spacing-sm);
}

.meeting-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
}

// ── Sections ──────────────────────────────────────────────────────────────────

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

.count-badge {
  background: var(--el-fill-color);
  border-radius: var(--radius-full);
  padding: 1px 7px;
  font-size: 11px;
  color: var(--el-text-color-secondary);
  font-weight: 400;
  text-transform: none;
  letter-spacing: 0;
}

// ── Title ─────────────────────────────────────────────────────────────────────

.title-section {
  gap: var(--spacing-sm);
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

  &.internal {
    background: var(--el-color-purple-light-9);
    color: var(--el-color-purple);
    border: 1px solid var(--el-color-purple-light-5);
  }
}

.meeting-title {
  font-family: 'Nunito', sans-serif;
  font-size: 28px;
  font-weight: var(--fw-bold);
  color: var(--el-color-purple-dark);
  margin: 0;
}

.title-input {
  font-size: 20px;
}

// ── Info ──────────────────────────────────────────────────────────────────────

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
}

.empty-text {
  font-size: 13px;
  color: var(--el-text-color-placeholder);
  font-style: italic;
  margin: 0;
}

// ── Time edit ─────────────────────────────────────────────────────────────────

.edit-time-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.time-arrow {
  color: var(--el-text-color-placeholder);
  font-size: 16px;
}

// ── Participants ──────────────────────────────────────────────────────────────

.participants-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.participant-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-md);
  border: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
  transition: background 0.15s;

  &:hover {
    background: var(--el-fill-color-light);
  }
}

.participant-avatar {
  background: var(--el-color-primary-light-7);
  color: var(--el-color-primary);
  font-size: 14px;
  font-weight: var(--fw-bold);
  flex-shrink: 0;
}

.participant-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.participant-name {
  font-size: 14px;
  font-weight: var(--fw-semibold);
  color: var(--el-text-color-primary);
}

.participant-role {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  text-transform: lowercase;
}
</style>
