<script setup lang="ts">
import dayjs from 'dayjs'
import 'dayjs/locale/fr'
import utc from 'dayjs/plugin/utc'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { meetingApi } from '../api/meeting.api'
import { Plus } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/authStore'
import { MEETING_COLORS } from '@/utils/meetingColor'
import { combineDateAndTime, timeStringToDate } from './utils'
import { useMeetingActions } from '../composables/useMeetingActions'
import ModalScope from './internal-meeting/ModalScope.vue'
import type { MeetingId } from '@armali/schemas'

dayjs.extend(utc)
dayjs.locale('fr')

const { meetingId, date } = defineProps<{
  meetingId: string
  date?: Date
  kind: 'ANIMAL' | 'INTERNAL'
}>()
const emit = defineEmits<{ close: [] }>()
const { user } = useAuthStore()
const router = useRouter()
const { saveSchedule, deleteMeeting, deleting } = useMeetingActions()

const isEditing = ref(false)
const showScopeDialog = ref(false)
const scopeDialogAction = ref<'save' | 'delete' | null>(null)
const showDeleteDialog = ref(false)
const pendingDeleteScope = ref<'single' | 'all'>('single')

const meeting = await meetingApi.get(meetingId, date ? date.toISOString() : undefined)
const dateForm = ref({
  date: meeting.date,
  startTime: dayjs.utc(meeting.startTime).format('HH:mm:ss'),
  endTime: dayjs.utc(meeting.endTime).format('HH:mm:ss'),
})
const dateLabel = computed(() => {
  const d = meeting.date
  if (!d) return ''
  const start = meeting.startTime ? dayjs.utc(meeting.startTime).format('H[h]mm') : ''
  const end = meeting.endTime ? dayjs.utc(meeting.endTime).format('H[h]mm') : ''
  return `Le ${dayjs(d).format('dddd D MMMM')} de ${start} à ${end}`
})

const title = computed(() => {
  if (meeting.kind === 'INTERNAL') return meeting.title
  if (meeting.kind === 'ANIMAL') return meeting.speciality?.name ?? 'Consultation'
  return ''
})

// Une récurrence est impliquée dès qu'un parentId existe (occurrence virtuelle
// ou override déjà matérialisé) — seul INTERNAL supporte le choix de scope
const isRecurringMeeting = computed(() => meeting.kind === 'INTERNAL' && !!meeting.parentId)

function confirmScope(scope: 'single' | 'all') {
  showScopeDialog.value = false
  const action = scopeDialogAction.value
  scopeDialogAction.value = null
  if (action === 'save') onSaveInternal(scope)
  if (action === 'delete') {
    pendingDeleteScope.value = scope
    showDeleteDialog.value = true
  }
}

const goToDetail = () => {
  router.push({
    path: `/${user?.role.toLowerCase()}/meetings/${meeting.id}`,
    query:
      date && String(meeting.id) === String(meeting.parentId)
        ? { date: date.toISOString() }
        : undefined,
  })
}

const onEdit = async () => {
  if (meeting.kind === 'INTERNAL') {
    if (isRecurringMeeting.value) {
      scopeDialogAction.value = 'save'
      showScopeDialog.value = true
    } else {
      onSaveInternal('single')
    }
  } else if (meeting.kind === 'ANIMAL') {
    try {
      await meetingApi.animal.update(meeting.id, {
        date: dateForm.value.date,
        startTime: timeStringToDate(dateForm.value.startTime),
        endTime: timeStringToDate(dateForm.value.endTime),
      })
      isEditing.value = false
    } catch (err) {
      console.log(err)
    }
  }
}

const onSaveInternal = async (scope: 'single' | 'all' = 'single') => {
  if (meeting.kind !== 'INTERNAL') return
  await saveSchedule({
    meetingId: meeting.id,
    parentId: meeting.parentId ?? null,
    targetDate: dateForm.value.date,
    startTime: dateForm.value.startTime,
    endTime: dateForm.value.endTime,
    originDate: meeting.date,
    scope,
    onSuccess: () => {
      isEditing.value = false
      emit('close')
    },
  })
}

function onDeleteClick() {
  if (isRecurringMeeting.value) {
    scopeDialogAction.value = 'delete'
    showScopeDialog.value = true
  } else {
    showDeleteDialog.value = true
  }
}

const onConfirmDelete = async () => {
  await deleteMeeting({
    kind: meeting.kind,
    meetingId: meeting.id as MeetingId,
    date: meeting.date,
    scope: pendingDeleteScope.value,
    onSuccess: () => {
      showDeleteDialog.value = false
      emit('close')
    },
  })
}

const isUpcoming = computed(() => {
  if (!meeting.date || !meeting.startTime) return false
  return combineDateAndTime(meeting.date, meeting.startTime) > new Date()
})

function participantInitials(p: { firstname?: string; lastname?: string }) {
  const first = p.firstname?.[0] ?? ''
  const last = p.lastname?.[0] ?? ''
  return `${first}${last}`.toUpperCase() || '?'
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
      <p v-if="!isEditing" class="popup-date">{{ dateLabel }}</p>
      <div v-else class="edit-row">
        <span>Le</span>
        <el-date-picker
          size="small"
          type="date"
          format="dddd D MMMM"
          style="width: 160px"
          v-model="dateForm.date"
        />
        <span>de</span>
        <el-time-picker
          size="small"
          style="width: 100px"
          value-format="HH:mm:ss"
          v-model="dateForm.startTime"
        />
        <span>à</span>
        <el-time-picker
          size="small"
          style="width: 100px"
          v-model="dateForm.endTime"
          value-format="HH:mm:ss"
        />
      </div>

      <!-- ANIMAL -->
      <template v-if="meeting.kind === 'ANIMAL'">
        <div class="popup-animal-row">
          <span class="animal-cell"
            >{{ meeting.animal.race.pet.name }} - {{ meeting.animal.race.name }}</span
          >
          <span class="animal-cell">{{ meeting.animal.name }}</span>
          <span class="animal-cell" v-if="meeting.animal.age?.years">{{
            meeting.animal.age?.years > 1
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
          <el-tooltip
            v-for="p in meeting.participants?.slice(0, 5)"
            :key="p.id"
            :content="participantInitials(p.user)"
            placement="top"
          >
            <el-avatar :size="32" class="participant-avatar" :src="p.user.avatarUrl ?? undefined">
              <template v-if="!p.user.avatarUrl">{{ participantInitials(p.user) }}</template>
            </el-avatar>
          </el-tooltip>
          <el-avatar
            v-if="(meeting.participants?.length ?? 0) > 5"
            :size="32"
            class="participant-avatar participant-avatar--more"
          >
            +{{ meeting.participants!.length - 5 }}
          </el-avatar>
        </div>
        <p v-if="meeting.description" class="popup-description">{{ meeting.description }}</p>
      </template>

      <div class="popup-actions" v-if="!isEditing">
        <el-row>
          <el-button v-if="isUpcoming" @click="isEditing = true" plain> Modifier </el-button>
          <el-button type="danger" v-if="isUpcoming" @click="onDeleteClick" plain>
            Supprimer
          </el-button>
        </el-row>
        <el-button @click="goToDetail" :type="MEETING_COLORS[meeting.kind]">
          <el-icon><Plus /></el-icon>
          Voir plus
        </el-button>
      </div>

      <div class="popup-actions" v-else>
        <el-button type="primary" @click="onEdit">Enregistrer</el-button>
        <el-button @click="isEditing = false">Annuler</el-button>
      </div>
    </div>
  </div>
  <ModalScope @on-confirm="(scope) => confirmScope(scope)" v-model="showScopeDialog" />
  <ConfirmDeleteDialog
    v-model="showDeleteDialog"
    title="Supprimer le rendez-vous ?"
    message="Cette action est définitive et ne peut pas être annulée."
    :loading="deleting"
    @confirm="onConfirmDelete"
  />
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
  background: color-mix(in srgb, var(--el-color-#{meeting-color('animal')}) 8%, transparent);
  border: 1.5px solid var(--el-color-#{meeting-color('animal')}-light-5);
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
  background: var(--el-color-#{meeting-color('internal')});
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
  justify-content: space-between;
}
// ── Participants ──────────────────────────────────────────────────────────────
.popup-participants {
  display: flex;
  align-items: center;
}

.participant-avatar {
  background: var(--el-color-#{meeting-color('internal')});
  border: 2px solid var(--el-bg-color);
  margin-left: -6px;
  flex-shrink: 0;

  &:first-child {
    margin-left: 0;
  }
}

.participant-avatar--more {
  font-size: var(--fs-xs);
  font-weight: var(--fw-semibold);
  z-index: 1;
}
</style>
