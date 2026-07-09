<script lang="ts" setup>
import type { VaccineMeta } from '@armali/schemas'
import NotebookVaccineRow from './NotebookVaccineRow.vue'

defineProps<{ vaccines: VaccineMeta[] }>()
</script>

<template>
  <div v-if="vaccines.length" class="vaccines-table">
    <div class="vaccines-header">
      <span>Vaccin</span>
      <span>Administré le</span>
      <span>Prochain rappel</span>
      <span>Statut</span>
    </div>
    <NotebookVaccineRow v-for="v in vaccines" :key="v.vaccineId" :vaccine="v" />
  </div>
  <p v-else class="empty-text">Aucun vaccin enregistré</p>
</template>

<style lang="scss" scoped>
.vaccines-table {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.vaccines-header {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr;
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--el-fill-color-light);
  font-size: 12px;
  font-weight: var(--fw-semibold);
  color: var(--el-text-color-secondary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  border-bottom: 1px solid var(--el-border-color-lighter);
}
</style>
