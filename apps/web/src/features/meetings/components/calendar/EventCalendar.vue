<script setup lang="ts">
import type { MeetingKind, MeetingStatus } from '@armali/schemas'
import dayjs from 'dayjs'

const { start, end } = defineProps<{
  title: string
  description?: string
  start: Date
  end: Date
  kind: Extract<MeetingKind, 'INTERNAL' | 'ANIMAL'>
  status: MeetingStatus
}>()

const timeRange = `${dayjs(start).format('H[h]mm')} - ${dayjs(end).format('H[h]mm')}`
</script>

<template>
  <div class="event" :class="[`kind-${kind}`, `status-${status}`]">
    <div class="event-left">
      <span class="fc-event-title">{{ title }}</span>
      <span class="event-sub" v-if="description">
        {{ description }}
      </span>
    </div>
    <span class="fc-event-time">{{ timeRange }}</span>
  </div>
</template>

<style lang="scss" scoped>
.event {
  padding: var(--spacing-sm);
  display: flex;
  height: 100%;
  overflow: hidden;
  border-left: 3px solid black;
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--spacing-xs);
  flex-direction: row-reverse;
  &.kind-ANIMAL {
    border-color: var(--el-color-teal-dark);
  }
  &.kind-INTERNAL {
    border-color: var(--el-color-purple-dark);
  }
}

.event-left {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.event-sub {
  font-size: var(--el-font-size-extra-small);
  color: var(--el-text-color-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
