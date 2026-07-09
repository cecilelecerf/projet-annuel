<script setup lang="ts">
import type { CreateVaccineCountryRule } from '@armali/schemas'
import { Delete, Plus } from '@element-plus/icons-vue'

defineProps<{ rules: CreateVaccineCountryRule[] }>()

const emit = defineEmits<{
  add: []
  remove: [index: number]
}>()

const COUNTRY_OPTIONS = [
  { label: 'France', value: 'FR' },
  { label: 'Belgique', value: 'BE' },
  { label: 'Suisse', value: 'CH' },
  { label: 'Luxembourg', value: 'LU' },
]
</script>

<template>
  <div class="rules-editor">
    <div class="rules-header">
      <label class="field-label">Règles par pays</label>
      <el-button size="small" :icon="Plus" plain @click="emit('add')">Ajouter</el-button>
    </div>

    <div v-if="rules.length === 0" class="rules-empty">Aucune règle définie</div>

    <div v-for="(rule, index) in rules" :key="index" class="rule-row">
      <el-select v-model="rule.country" placeholder="Pays" style="width: 120px">
        <el-option v-for="c in COUNTRY_OPTIONS" :key="c.value" :label="c.label" :value="c.value" />
      </el-select>

      <el-input-number
        v-model="rule.minAge"
        :min="0"
        placeholder="Âge min (sem.)"
        style="width: 130px"
      />

      <el-select v-model="rule.type" style="width: 140px">
        <el-option label="Obligatoire" value="MANDATORY" />
        <el-option label="Recommandé" value="RECOMMENDED" />
      </el-select>

      <el-button type="danger" plain :icon="Delete" @click="emit('remove', index)" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.rules-editor {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}
.rules-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.field-label {
  font-size: 13px;
  font-weight: var(--fw-semibold);
  color: var(--el-text-color-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.rules-empty {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
  font-style: italic;
}
.rule-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}
</style>
