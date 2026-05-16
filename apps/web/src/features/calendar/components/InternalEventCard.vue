<script setup lang="ts">
import dayjs from 'dayjs'

const { event, start, end } = defineProps<{
  event: any
  start: Date
  end: Date
}>()

const timeRange = `${dayjs(start).format('H[h]mm')} - ${dayjs(end).format('H[h]mm')}`
</script>

<template>
  <div class="event">
    <div class="event-header">
      <span class="event-type">Réunion</span>
      <span class="event-time">{{ timeRange }}</span>
    </div>
    <p class="event-title">{{ event.title }}</p>
    <p v-if="event.extendedProps.description" class="event-sub">
      {{ event.extendedProps.description }}
    </p>
    <div class="event-footer">
      <div class="avatars">
        <el-avatar
          v-for="p in event.extendedProps.participants?.slice(0, 3)"
          :key="p.id"
          :size="18"
          class="avatar"
        >
          ?
        </el-avatar>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.event {
  padding: 6px 8px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  height: 100%;
  overflow: hidden;
  border: 1px solid var(--el-color-purple);
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

.event-title,
.event-sub {
  font-size: 12px;
  margin: 0;
  opacity: 0.85;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.event-footer {
  margin-top: auto;
  display: flex;
  justify-content: flex-end;
}

.avatars {
  display: flex;
  gap: -2px;
}

.avatar {
  background: rgba(124, 92, 191, 0.3);
  color: #7c5cbf;
  font-size: 10px;
  border: 1.5px solid white;
  margin-left: -4px;
  &:first-child {
    margin-left: 0;
  }
}
</style>
