<script setup lang="ts">
import { ChatDotRound } from '@element-plus/icons-vue'

defineProps<{
  editing: boolean
}>()

const title = defineModel<string>('title', { default: '' })
</script>

<template>
  <div class="section title-section">
    <div class="kind-badge internal">
      <el-icon><ChatDotRound /></el-icon>
      Réunion interne
    </div>
    <el-input v-if="editing" v-model="title" size="large" class="title-input" />
    <h1 v-else class="meeting-title">{{ title }}</h1>
  </div>
</template>

<style scoped>
.section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.title-section {
  gap: var(--spacing-sm);
}

.kind-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: var(--radius-full);
  font-size: 12px;
  font-weight: var(--fw-semibold);
  width: fit-content;
}

.kind-badge.internal {
  background: var(--el-color-purple-light-9);
  color: var(--el-color-purple);
  border: 1px solid var(--el-color-purple-light-5);
}

.meeting-title {
  font-family: 'Nunito', sans-serif;
  font-size: 28px;
  font-weight: var(--fw-bold);
  color: var(--el-color-purple-dark);
  margin: 0;
}

.title-input {
  font-size: 20px;
}
</style>
