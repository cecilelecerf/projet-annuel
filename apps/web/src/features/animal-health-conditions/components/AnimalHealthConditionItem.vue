<script lang="ts" setup>
import type { ClientPetHealthConditionMeta } from '@armali/schemas'
import dayjs from 'dayjs'

defineProps<{ condition: ClientPetHealthConditionMeta }>()
</script>
<template>
  <div class="condition-card">
    <div class="condition-header">
      <span class="condition-name">{{ condition.healthCondition?.name }}</span>
      <span class="condition-date">
        Diagnostiqué le {{ dayjs(condition.diagnosedAt).format('D MMM YYYY') }}
      </span>
    </div>
    <p v-if="condition.notes" class="condition-notes">{{ condition.notes }}</p>
  </div>
</template>
<style lang="scss" scoped>
.condition-card {
  padding: var(--spacing-md);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--radius-lg);
  background: var(--el-bg-color);
}

.condition-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
}

.condition-name {
  font-size: 14px;
  font-weight: var(--fw-semibold);
  color: var(--el-text-color-primary);
}

.condition-date {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.condition-notes {
  margin: var(--spacing-xs) 0 0;
  font-size: 13px;
  color: var(--el-text-color-secondary);
  line-height: 1.5;
}
</style>
