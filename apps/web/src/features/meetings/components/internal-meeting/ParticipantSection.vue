<script setup lang="ts">
import { User } from '@element-plus/icons-vue'
import type { InternalMeetingMeta } from '@armali/schemas'

defineProps<{
  participants: InternalMeetingMeta['participants']
}>()

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
        <el-tag :type="statusColor(p.status)" size="small" round>
          {{ statusLabel(p.status) }}
        </el-tag>
      </div>
    </div>
  </div>
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

.participant-row:hover {
  background: var(--el-fill-color-light);
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
