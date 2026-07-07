<script setup lang="ts">
import { computed } from 'vue'
import { Check, Close } from '@element-plus/icons-vue'

const props = defineProps<{
  isValid: boolean
  hasSelection: boolean
}>()

const start = defineModel<string>('start', { required: true })
const end = defineModel<string>('end', { required: true })

const statusMessage = computed(() => {
  if (!props.hasSelection) return null
  return props.isValid ? 'Dans une plage libre' : 'Hors disponibilité ou conflit'
})
</script>

<template>
  <div class="time-range-inputs">
    <div class="time-slot">
      <span class="time-label">De</span>
      <el-time-picker
        v-model="start"
        placeholder="09:00"
        format="HH:mm"
        value-format="HH:mm:ss"
        size="large"
        style="width: 100%"
      />
    </div>
    <div class="time-divider">→</div>
    <div class="time-slot">
      <span class="time-label">À</span>
      <el-time-picker
        v-model="end"
        placeholder="10:00"
        format="HH:mm"
        value-format="HH:mm:ss"
        size="large"
        style="width: 100%"
      />
    </div>
    <span
      v-if="statusMessage"
      class="status"
      :class="isValid ? 'status--valid' : 'status--invalid'"
    >
      <el-icon><component :is="isValid ? Check : Close" /></el-icon>
      {{ statusMessage }}
    </span>
  </div>
</template>

<style lang="scss" scoped>
.time-range-inputs {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
}

.time-slot {
  flex: 1;
  min-width: 120px;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.time-label {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

.time-divider {
  color: var(--el-text-color-placeholder);
  padding-top: 20px;
  font-size: 16px;
}

.status {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  font-weight: var(--fw-medium);
  white-space: nowrap;

  &--valid {
    color: var(--el-color-success);
  }

  &--invalid {
    color: var(--el-color-danger);
  }
}
</style>
