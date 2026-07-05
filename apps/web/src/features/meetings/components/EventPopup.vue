<script setup lang="ts">
import dayjs from 'dayjs'
import 'dayjs/locale/fr'
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import { calendarApi } from '../api/calendar.api'
import { Plus } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/authStore'
import { useFormErrorStore } from '@/stores/formErrorStore'

dayjs.locale('fr')

const { meetingId, date } = defineProps<{
  meetingId: string
  date: Date
}>()
const emit = defineEmits<{ close: []; delete: [] }>()
const { user } = useAuthStore()
const router = useRouter()
const formErrorStore = useFormErrorStore()
const meeting = await calendarApi.get(meetingId, date ? date.toISOString() : undefined)

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
  router.push(
    `/${user?.role.toLowerCase()}/meetings/${meeting.id}${date ? `?date=${date.toISOString()}` : ''}`,
  )
}

const onDelete = async () => {
  try {
    await ElMessageBox.confirm('Cette action est irréversible.', 'Supprimer cet événement ?', {
      confirmButtonText: 'Supprimer',
      cancelButtonText: 'Annuler',
      type: 'warning',
    })
  } catch {
    return
  }

  try {
    await calendarApi.delete(meeting.id)
    emit('delete')
  } catch (err) {
    formErrorStore.handle(err)
  }
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
            >{{ meeting.animal.race.pet.name }} - {{ meeting.animal.race.name }}</span
          >
          <span class="animal-cell">{{ meeting.animal.name }}</span>
          <span class="animal-cell">{{
            meeting.animal.age.years > 1
              ? `${meeting.animal.age.years} ans`
              : meeting.animal.age.years > 0
                ? `${meeting.animal.age.years} an et ${meeting.animal.age.months} mois`
                : `${meeting.animal.age.months} mois`
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

      <div class="popup-actions">
        <el-row>
          <el-button @click="goToDetail" plain>Modifier</el-button>
          <el-button type="danger" @click="onDelete" plain>Supprimer</el-button>
        </el-row>
        <el-button
          @click="goToDetail"
          type="primary"
          :color="meeting.kind === 'ANIMAL' ? 'var(--el-color-teal)' : ' var(--el-color-purple)'"
        >
          <el-icon><Plus /></el-icon>
          Voir plus
        </el-button>
      </div>
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
  background: color-mix(in srgb, var(--el-color-teal) 8%, transparent);
  border: 1.5px solid var(--el-color-teal-light);
  border-radius: var(--radius-md);
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
  background: var(--el-color-purple-light);
  color: var(--el-color-purple-dark);
  font-size: 12px;
  border: 2px solid var(--el-bg-color);
  margin-left: -6px;
  &:first-child {
    margin-left: 0;
  }
}

// ── Actions ───────────────────────────────────────────────────────────────────
.popup-actions {
  display: flex;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-xs);
  justify-content: space-between;
}
</style>
