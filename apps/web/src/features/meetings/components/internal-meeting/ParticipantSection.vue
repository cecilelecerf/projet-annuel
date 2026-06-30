<script setup lang="ts">
import { ref, computed } from 'vue'
import { User, Check, Close, Edit } from '@element-plus/icons-vue'
import type { InternalMeetingMeta } from '@armali/schemas'
import { calendarApi } from '../../api/calendar.api'
import { useAuthStore } from '@/stores/authStore'
import ModalScope from './ModalScope.vue'

const { meeting } = defineProps<{
  participants: InternalMeetingMeta['participants']
  meeting: InternalMeetingMeta
}>()

const emit = defineEmits<{
  updated: []
}>()

const { user } = useAuthStore()

const showScopeDialog = ref(false)
const pendingStatus = ref<'ACCEPTED' | 'DECLINED' | null>(null)
const responding = ref(false)
const edit = ref(false)

const myParticipant = computed(() => meeting.participants?.find((p) => p.userId === user?.id))

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

async function respond(status: 'ACCEPTED' | 'DECLINED') {
  if (meeting.parentId) {
    pendingStatus.value = status
    showScopeDialog.value = true
    return
  }

  responding.value = true
  try {
    await calendarApi.internal.participantUpdate(meeting.id, { status, scope: 'single' })
    emit('updated')
  } finally {
    responding.value = false
  }
}

async function confirmScope(scope: 'single' | 'all') {
  if (!pendingStatus.value) return

  responding.value = true
  try {
    await calendarApi.internal.participantUpdate(meeting.id, {
      status: pendingStatus.value,
      scope,
      date: scope === 'single' ? meeting.date : undefined,
    })
    emit('updated')
  } finally {
    responding.value = false
    showScopeDialog.value = false
    pendingStatus.value = null
  }
}
</script>

<template>
  <div class="section">
    <h3 class="section-label">
      <el-icon><User /></el-icon>
      Participants
      <span class="count-badge">{{ participants?.length ?? 0 }}</span>
    </h3>

    <div class="participants-list">
      <div v-for="p in participants" :key="p.id" class="participant-row">
        <el-avatar :size="36" class="participant-avatar">
          {{ p.user?.firstname?.charAt(0) ?? '?' }}
        </el-avatar>
        <div class="participant-info">
          <span class="participant-name"> {{ p.user?.firstname }} {{ p.user?.lastname }} </span>
          <span class="participant-role">{{ p.user?.role }}</span>
        </div>
        <div
          class="my-response-actions"
          v-if="p.userId === myParticipant?.userId && (myParticipant.status === 'PENDING' || edit)"
        >
          <el-button
            type="success"
            plain
            size="small"
            :icon="Check"
            :loading="responding"
            @click="respond('ACCEPTED')"
          >
            Accepter
          </el-button>
          <el-button
            type="danger"
            plain
            size="small"
            :icon="Close"
            :loading="responding"
            @click="respond('DECLINED')"
          >
            Refuser
          </el-button>
        </div>
        <el-row v-else>
          <el-button
            v-if="p.userId === myParticipant?.userId"
            type="secondary"
            round
            size="small"
            :icon="Edit"
            :loading="responding"
            @click="edit = true"
          />
          <el-tag :type="statusColor(p.status)" size="small" round>
            {{ statusLabel(p.status) }}
          </el-tag>
        </el-row>
      </div>
    </div>
  </div>

  <ModalScope v-model="showScopeDialog" @on-confirm="confirmScope" />
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

.my-response {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-md);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-md);
  background: var(--el-color-warning-light-9);
  border: 1px solid var(--el-color-warning-light-5);
}

.my-response-text {
  font-size: 13px;
  color: var(--el-text-color-regular);
}

.my-response-actions {
  display: flex;
  gap: var(--spacing-xs);
}

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
}

.participant-avatar {
  background: var(--el-color-purple-light-7);
  color: var(--el-color-purple);
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
