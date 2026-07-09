<script setup lang="ts">
import type { ClinicAct, ActType } from '@armali/schemas'
import { Delete, Edit } from '@element-plus/icons-vue'
import { ACT_TYPE_LABELS } from '@/features/acts/composables/useActForm'
import { getActTypeBadge } from '@/features/acts/utils'

defineProps<{
  clinicActs: ClinicAct[]
  loading: boolean
}>()

const emit = defineEmits<{
  edit: [clinicAct: ClinicAct]
  delete: [clinicAct: ClinicAct]
}>()

function sortByName(a: ClinicAct, b: ClinicAct) {
  return (a.act?.name ?? '').localeCompare(b.act?.name ?? '')
}

function sortByType(a: ClinicAct, b: ClinicAct) {
  if (!a.act || !b.act) return 0
  return ACT_TYPE_LABELS[a.act.type as ActType].localeCompare(
    ACT_TYPE_LABELS[b.act.type as ActType],
  )
}

function sortByBasePrice(a: ClinicAct, b: ClinicAct) {
  return (a.act?.basePrice ?? 0) - (b.act?.basePrice ?? 0)
}

function sortByPrice(a: ClinicAct, b: ClinicAct) {
  return a.price - b.price
}
</script>

<template>
  <el-table v-loading="loading" :data="clinicActs" stripe empty-text="Aucun tarif configuré">
    <el-table-column label="Type" width="160" sortable :sort-method="sortByType">
      <template #default="{ row }">
        <el-tag v-if="row.act" :type="getActTypeBadge(row.act.type as ActType)" size="small">
          {{ ACT_TYPE_LABELS[row.act.type as ActType] }}
        </el-tag>
        <span v-else>—</span>
      </template>
    </el-table-column>
    <el-table-column label="Acte" min-width="180" sortable :sort-method="sortByName">
      <template #default="{ row }">{{ row.act?.name ?? '—' }}</template>
    </el-table-column>

    <el-table-column label="Prix indicatif" width="130" sortable :sort-method="sortByBasePrice">
      <template #default="{ row }">{{ row.act?.basePrice?.toFixed(2) ?? '—' }} €</template>
    </el-table-column>
    <el-table-column label="Prix clinique" width="130" sortable :sort-method="sortByPrice">
      <template #default="{ row }">{{ row.price.toFixed(2) }} €</template>
    </el-table-column>
    <el-table-column label="Actions" width="130" fixed="right">
      <template #default="{ row }">
        <div class="actions-column">
          <el-button type="primary" plain :icon="Edit" @click="emit('edit', row)" />
          <el-button type="danger" plain :icon="Delete" @click="emit('delete', row)" />
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
