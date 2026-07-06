<script setup lang="ts">
import type { MeetingKind } from '@armali/schemas'
import { ChatDotRound, FirstAidKit } from '@element-plus/icons-vue'
import { MEETING_COLORS } from '@/utils/meetingColor.ts'

defineProps<{
  type: Extract<MeetingKind, 'INTERNAL' | 'ANIMAL'>
  canCreateAnimal: boolean
}>()

const emit = defineEmits<{ 'update:type': [Extract<MeetingKind, 'INTERNAL' | 'ANIMAL'>] }>()
</script>

<template>
  <div v-if="canCreateAnimal" class="type-selector">
    <el-button
      :type="MEETING_COLORS.INTERNAL"
      :plain="type !== 'INTERNAL'"
      :icon="ChatDotRound"
      class="type-btn"
      @click="emit('update:type', 'INTERNAL')"
    >
      Réunion
    </el-button>
    <el-button
      :type="MEETING_COLORS.ANIMAL"
      :plain="type !== 'ANIMAL'"
      :icon="FirstAidKit"
      class="type-btn"
      @click="emit('update:type', 'ANIMAL')"
    >
      Rendez-vous
    </el-button>
  </div>

  <div v-else class="type-info-banner">
    <el-icon><ChatDotRound /></el-icon>
    Réunion interne uniquement
  </div>
</template>

<style lang="scss" scoped>
.type-selector {
  display: flex;
  gap: var(--spacing-sm);
  padding: var(--spacing-md) var(--spacing-lg);
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.type-btn {
  flex: 1;
}

.type-info-banner {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm) var(--spacing-lg);
  border-bottom: 1px solid var(--el-border-color-lighter);
  background: var(--el-color-#{meeting-color('internal')}-light-9, #f5f0fb);
  color: var(--el-color-#{meeting-color('internal')}, #9f6de0);
  font-size: 13px;
  font-weight: var(--fw-medium);
}
</style>
