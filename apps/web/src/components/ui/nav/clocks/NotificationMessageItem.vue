<script setup lang="ts">
defineProps<{
  title: string
  preview?: string | null
  unreadCount?: number
}>()
</script>

<template>
  <div class="notif-item" :class="{ 'notif-item--unread': !!unreadCount }">
    <div class="notif-item__top">
      <strong>{{ title }}</strong>
      <el-badge v-if="unreadCount" :value="unreadCount" />
    </div>
    <span v-if="preview" class="notif-item__preview">{{ preview }}</span>
  </div>
</template>

<style scoped lang="scss">
.notif-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-width: 260px;
  padding: var(--spacing-xs) var(--spacing-sm);
  margin: -4px -8px;
  border-radius: var(--radius-sm);
  background: var(--el-bg-color);
  transition: background 0.15s ease;
}
.notif-item--unread {
  background: var(--el-color-primary-light-9);
}
.notif-item__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.notif-item__preview {
  font-size: var(--el-font-size-small);
  color: var(--el-text-color-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>