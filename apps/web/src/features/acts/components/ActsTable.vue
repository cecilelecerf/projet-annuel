<script setup lang="ts">
import type { Act, ActType } from '@armali/schemas'
import { ACT_TYPE_LABELS } from '../composables/useActForm'
import { Delete, Edit } from '@element-plus/icons-vue'
import { getActTypeBadge } from '../utils'

defineProps<{
  acts: Act[]
  loading: boolean
}>()

const emit = defineEmits<{
  edit: [act: Act]
  delete: [act: Act]
}>()

function sortByName(a: Act, b: Act) {
  return a.name.localeCompare(b.name)
}

function sortByType(a: Act, b: Act) {
  return ACT_TYPE_LABELS[a.type as ActType].localeCompare(ACT_TYPE_LABELS[b.type as ActType])
}

function sortByPrice(a: Act, b: Act) {
  return a.basePrice - b.basePrice
}
</script>

<template>
  <el-table v-loading="loading" :data="acts" stripe empty-text="Aucun acte">
    <el-table-column label="Type" width="160" sortable :sort-method="sortByType">
      <template #default="{ row }">
        <el-tag :type="getActTypeBadge(row.type as ActType)" size="small">
          {{ ACT_TYPE_LABELS[row.type as ActType] }}
        </el-tag>
      </template>
    </el-table-column>
    <el-table-column prop="name" label="Nom" min-width="180" sortable :sort-method="sortByName" />

    <el-table-column label="Prix de base" width="130" sortable :sort-method="sortByPrice">
      <template #default="{ row }">{{ row.basePrice.toFixed(2) }} €</template>
    </el-table-column>
    <el-table-column prop="description" label="Description" min-width="200" show-overflow-tooltip />
    <el-table-column label="Actions" width="130" fixed="right">
      <template #default="{ row }">
        <div class="actions-column">
          <el-button type="primary" plain @click="emit('edit', row)" :icon="Edit" />
          <el-button type="danger" plain @click="emit('delete', row)" :icon="Delete" />
        </div>
      </template>
    </el-table-column>
  </el-table>
</template>

<style scoped lang="scss">
.actions-column {
  display: flex;
  justify-content: center;
}
</style>
