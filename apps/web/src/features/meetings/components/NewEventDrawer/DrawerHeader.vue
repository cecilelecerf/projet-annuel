<script setup lang="ts">
import type { MeetingKind } from '@armali/schemas'

defineProps<{
  type: Extract<MeetingKind, 'INTERNAL' | 'ANIMAL'>
}>()

defineEmits<{ close: [] }>()
</script>

<template>
  <div class="drawer-header">
    <div class="header-left">
      <div class="type-dot" :class="type === 'INTERNAL' ? 'dot-internal' : 'dot-animal'" />
      <h3>Nouvel événement</h3>
    </div>
    <el-icon class="close-btn" @click="$emit('close')">
      <CloseBold />
    </el-icon>
  </div>
</template>

<style lang="scss" scoped>
.drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-lg) var(--spacing-lg) var(--spacing-md);
  border-bottom: 1px solid var(--el-border-color-lighter);

  .header-left {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
  }

  h3 {
    margin: 0;
    font-size: 18px;
    color: var(--el-text-color-primary);
  }
}

.type-dot {
  width: 10px;
  height: 10px;
  border-radius: var(--radius-full);
  transition: background-color 0.2s;

  &.dot-internal {
    background-color: var(--el-color-#{meeting-color('internal')});
  }

  &.dot-animal {
    background-color: var(--el-color-#{meeting-color('animal')});
  }
}

.close-btn {
  cursor: pointer;
  font-size: 18px;
  color: var(--el-text-color-secondary);
  transition: color 0.2s;

  &:hover {
    color: var(--el-text-color-primary);
  }
}
</style>
