<script setup lang="ts">
import { Document } from '@element-plus/icons-vue'

defineProps<{
  editing: boolean
}>()

const description = defineModel<string | null>('description')
</script>

<template>
  <div class="section">
    <h3 class="section-label">
      <el-icon><Document /></el-icon>
      Description
    </h3>
    <el-input
      v-if="editing"
      v-model="description"
      type="textarea"
      :rows="3"
      placeholder="Ajouter une description..."
    />
    <p v-else-if="description" class="description-text">
      {{ description }}
    </p>
    <p v-else class="empty-text">Aucune description</p>
  </div>
</template>

<style scoped>
.section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.section-label {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: 13px;
  font-weight: var(--fw-semibold);
  color: var(--el-text-color-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0;
}

.description-text {
  font-size: 14px;
  color: var(--el-text-color-secondary);
  line-height: 1.6;
  margin: 0;
}

.empty-text {
  font-size: 13px;
  color: var(--el-text-color-placeholder);
  font-style: italic;
  margin: 0;
}
</style>
