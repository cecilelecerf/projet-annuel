<script setup lang="ts">
interface InfoRow {
  label: string
  value: string
  isLink?: boolean
  preLine?: boolean
}

defineProps<{
  rows: InfoRow[]
}>()
</script>

<template>
  <div class="profil-info">
    <div v-for="row in rows" :key="row.label" class="info-row">
      <span class="info-label">{{ row.label }}</span>
      <a v-if="row.isLink" :href="row.value" target="_blank" class="info-value">
        {{ row.value }}
      </a>
      <span v-else class="info-value" :class="{ 'info-value--pre': row.preLine }">
        {{ row.value }}
      </span>
    </div>
  </div>
</template>

<style scoped lang="scss">
.profil-info {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}
.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--spacing-md);
}
.info-label {
  color: var(--el-text-color-secondary);
  font-size: var(--fs-md);
  flex-shrink: 0;
}
.info-value {
  font-weight: var(--fw-medium);
  color: var(--el-text-color-primary);
  text-align: right;
}
.info-value--pre {
  white-space: pre-line;
}
</style>
