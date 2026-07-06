<script setup lang="ts">
import type { TimelineSegment } from '@/features/meetings/composables/useAvailabilityTimeline'

defineProps<{
  segments: TimelineSegment[]
  selection: { startPercent: number; widthPercent: number; isValid: boolean } | null
}>()
</script>

<template>
  <div class="timeline-bar">
    <div
      v-for="segment in segments"
      :key="`${segment.kind}-${segment.startPercent}-${segment.widthPercent}`"
      class="segment"
      :class="`segment--${segment.kind}`"
      :style="{ left: `${segment.startPercent}%`, width: `${segment.widthPercent}%` }"
    />
    <div
      v-if="selection"
      class="selection-overlay"
      :class="selection.isValid ? 'selection-overlay--valid' : 'selection-overlay--invalid'"
      :style="{ left: `${selection.startPercent}%`, width: `${selection.widthPercent}%` }"
    />
  </div>
</template>

<style lang="scss" scoped>
.timeline-bar {
  position: relative;
  height: 48px;
  border-radius: var(--radius-full);
  overflow: hidden;
  background: var(--el-fill-color-light);
}

.segment {
  position: absolute;
  top: 0;
  height: 100%;

  &--available {
    background: var(--el-color-success-light-5);
  }

  &--busy {
    background: var(--el-color-danger-light-5);
  }

  &--off {
    background: transparent;
  }
}

.selection-overlay {
  position: absolute;
  top: 0;
  height: 100%;
  border-width: 2px;
  border-style: solid;
  border-radius: 3px;
  box-sizing: border-box;
  pointer-events: none;

  &--valid {
    border-color: var(--el-color-primary);
    background: rgba(64, 158, 255, 0.15);
  }

  &--invalid {
    border-color: var(--el-color-danger);
    background: rgba(245, 108, 108, 0.15);
  }
}
</style>
