<script setup lang="ts">
import dayjs from 'dayjs'
import 'dayjs/locale/fr'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { calendarApi } from '../api/calendar.api'

dayjs.locale('fr')

const { meetingId } = defineProps<{ meetingId: string }>()
const emit = defineEmits<{ close: []; delete: [] }>()
const router = useRouter()
const isEditing = ref(false)
const meeting = await calendarApi.getMeeting(meetingId)

const dateLabel = computed(() => {
  const date = meeting.date
  if (!date) return ''
  const start = meeting.startTime ? dayjs(meeting.startTime).format('H[h]mm') : ''
  const end = meeting.endTime ? dayjs(meeting.endTime).format('H[h]mm') : ''
  return `Le ${dayjs(date).format('dddd D MMMM')} de ${start} à ${end}`
})

const title = computed(() => {
  if (meeting.kind === 'INTERNAL') return meeting.title
  if (meeting.kind === 'ANIMAL') return meeting.description ?? 'Consultation'
  return ''
})

const goToDetail = () => {
  router.push(`/meetings/${meeting.id}`)
}
const onEdit = () => {}
const onDelete = () => {
  emit('delete')
}
</script>

<template>
  <div class="popup-overlay" @click.self="$emit('close')">
    <div class="popup">
      <!-- Header -->
      <div class="popup-header">
        <h3 class="popup-title">{{ title }}</h3>
        <el-icon class="popup-close" @click="$emit('close')"><CircleCloseFilled /></el-icon>
      </div>

      <!-- Date -->
      <p class="popup-date">{{ dateLabel }}</p>

      <!-- ANIMAL -->

      <template v-if="meeting.kind === 'ANIMAL'">
        <div class="popup-animal-row">
          <span class="animal-cell"
            >{{ meeting.ownedPet.race.pet.name }} - {{ meeting.ownedPet.race.name }}</span
          >
          <span class="animal-cell">{{ meeting.ownedPet.name }}</span>
          <span class="animal-cell">{{
            meeting.ownedPet.age.years > 1
              ? `${meeting.ownedPet.age.years} ans`
              : meeting.ownedPet.age.years > 0
                ? `${meeting.ownedPet.age.years} an et ${meeting.ownedPet.age.months} mois`
                : `${meeting.ownedPet.age.months} mois`
          }}</span>
        </div>
      </template>

      <!-- INTERNAL -->
      <template v-if="meeting.kind === 'INTERNAL'">
        <div class="popup-participants">
          <el-avatar
            v-for="p in meeting.participants?.slice(0, 5)"
            :key="p.id"
            :size="32"
            class="participant-avatar"
          >
            ?
          </el-avatar>
        </div>
        <p v-if="meeting.description" class="popup-description">{{ meeting.description }}</p>
      </template>

      <!-- Mode lecture -->
      <template v-if="!isEditing">
        <div class="popup-actions">
          <el-button type="primary" @click="isEditing = true">Modifier</el-button>
          <el-button type="danger" @click="onDelete">Supprimer</el-button>
          <el-button @click="goToDetail">
            <el-icon><ArrowRight /></el-icon>
            Détails
          </el-button>
        </div>
      </template>

      <!-- Mode édition -->
      <template v-else>
        <div class="edit-row">
          <span>Le</span>
          <el-date-picker size="small" type="date" format="dddd D MMMM" style="width: 160px" />
          <span>de</span>
          <el-time-picker size="small" style="width: 100px" />
          <span>à</span>
          <el-time-picker size="small" style="width: 100px" />
        </div>

        <div class="popup-actions">
          <el-button type="primary" @click="onEdit">Enregistrer</el-button>
          <el-button @click="isEditing = false">Annuler</el-button>
        </div>
      </template>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.popup-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(2px);
}

.popup {
  background: var(--el-bg-color);
  border-radius: var(--radius-xl);
  padding: var(--spacing-lg);
  width: 480px;
  max-width: 90vw;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
}

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.popup-title {
  font-weight: var(--fw-bold);
  color: var(--el-text-color-primary);
  margin: 0;
}

.popup-close {
  cursor: pointer;
  color: var(--el-text-color-placeholder);
  transition: color 0.2s;
  &:hover {
    color: var(--el-text-color-primary);
  }
}

.popup-date {
  font-size: 14px;
  color: var(--el-text-color-secondary);
  margin: 0;
}

.popup-description {
  color: var(--el-text-color-secondary);
  margin: 0;
}

// ── Animal row ────────────────────────────────────────────────────────────────
.popup-animal-row {
  display: flex;
  align-items: center;
  justify-content: space-around;
  background: color-mix(in srgb, var(--el-color-primary) 8%, transparent);
  border: 1.5px solid var(--el-color-primary-light-5);
  border-radius: var(--radius-full);
  padding: var(--spacing-sm) var(--spacing-lg);
  gap: var(--spacing-md);
}

.animal-cell {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  flex: 1;
  text-align: center;
}

// ── Participants ──────────────────────────────────────────────────────────────
.popup-participants {
  display: flex;
  gap: -4px;
}

.participant-avatar {
  background: var(--el-color-primary-light-5);
  color: var(--el-color-primary);
  font-size: 12px;
  border: 2px solid var(--el-bg-color);
  margin-left: -6px;
  &:first-child {
    margin-left: 0;
  }
}

// ── Edit row ──────────────────────────────────────────────────────────────────
.edit-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

// ── Actions ───────────────────────────────────────────────────────────────────
.popup-actions {
  display: flex;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-xs);
}
</style>
