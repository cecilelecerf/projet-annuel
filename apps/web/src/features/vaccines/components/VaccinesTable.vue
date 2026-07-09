<script setup lang="ts">
import { countryFlag } from '@/utils/countryFlag'
import type { Vaccine } from '@armali/schemas'
import { Delete, Edit } from '@element-plus/icons-vue'

defineProps<{
  vaccines: Vaccine[]
  loading: boolean
  petLabel: (petId: string) => string
}>()

const emit = defineEmits<{
  edit: [vaccine: Vaccine]
  delete: [vaccine: Vaccine]
}>()

function sortByName(a: Vaccine, b: Vaccine) {
  return (a.act?.name ?? '').localeCompare(b.act?.name ?? '')
}

function sortByPrice(a: Vaccine, b: Vaccine) {
  return (a.act?.basePrice ?? 0) - (b.act?.basePrice ?? 0)
}

function sortByRecommendedAge(a: Vaccine, b: Vaccine) {
  return a.recommendedAge - b.recommendedAge
}
</script>

<template>
  <el-table v-loading="loading" :data="vaccines" stripe empty-text="Aucun vaccin">
    <el-table-column label="Nom" min-width="160" sortable :sort-method="sortByName">
      <template #default="{ row }">{{ row.act?.name ?? '—' }}</template>
    </el-table-column>
    <el-table-column label="Espèce" width="120">
      <template #default="{ row }">{{ petLabel(row.petId) }}</template>
    </el-table-column>
    <el-table-column
      label="Âge recommandé"
      width="140"
      sortable
      :sort-method="sortByRecommendedAge"
    >
      <template #default="{ row }">{{ row.recommendedAge }} sem.</template>
    </el-table-column>
    <el-table-column label="Rappel" width="110">
      <template #default="{ row }">{{ row.boosterInterval }} sem.</template>
    </el-table-column>
    <el-table-column label="Prix" width="100" sortable :sort-method="sortByPrice">
      <template #default="{ row }">{{ (row.act?.basePrice ?? 0).toFixed(2) }} €</template>
    </el-table-column>
    <el-table-column label="Règles pays" min-width="200">
      <template #default="{ row }">
        <div class="rules-tags">
          <el-tag
            v-for="rule in row.countryRules"
            :key="rule.id"
            size="small"
            :type="rule.type === 'MANDATORY' ? 'danger' : 'info'"
          >
            <span class="flag">{{ countryFlag(rule.country) }}</span>
            {{ rule.country }} · {{ rule.type === 'MANDATORY' ? 'Obl.' : 'Rec.' }}
          </el-tag>
        </div>
      </template>
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

<style lang="scss" scoped>
.actions-column {
  display: flex;
  justify-content: center;
}
.rules-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
</style>
