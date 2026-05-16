<script setup lang="ts">
import dayjs from 'dayjs'

const { event, start, end } = defineProps<{
  event: any
  start: Date
  end: Date
}>()

const timeRange = `${dayjs(start).format('H[h]mm')} - ${dayjs(end).format('H[h]mm')}`
const label = event.extendedProps.description ?? 'Consultation'
</script>

<template>
  <div class="event">
    <div class="event-header">
      <span class="event-type">{{ label }}</span>
      <span class="event-time">{{ timeRange }}</span>
    </div>
    <p class="event-sub">Nom patient</p>
    <div class="event-footer">
      <el-avatar :size="18" class="avatar">
        <el-icon><User /></el-icon>
      </el-avatar>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.event {
  padding: 6px 8px;
  display: flex;
  flex-direction: column;
  width: 90%;
  color: black;
  gap: 2px;
  height: 100%;
  overflow: hidden;
  background: none;
  border: 1px solid var(--el-color-teal);
}

.event-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.event-type {
  font-weight: var(--fw-semibold);
  font-size: 13px;
}

.event-time {
  font-size: 11px;
  opacity: 0.75;
  white-space: nowrap;
}

.event-sub {
  font-size: 12px;
  margin: 0;
  opacity: 0.85;
}

.event-footer {
  margin-top: auto;
  display: flex;
  justify-content: flex-end;
}

.avatar {
  background: rgba(32, 201, 170, 0.3);
  color: #4db6ac;
}
</style>
