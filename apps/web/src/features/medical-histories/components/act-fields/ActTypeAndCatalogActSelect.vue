<script setup lang="ts">
import type { Act, ActType, CreateFreeMedicalHistory } from '@armali/schemas'
import { ACT_TYPE_OPTIONS } from '@/features/acts/composables/useActForm'

defineProps<{
  actsForSelectedType: Act[]
}>()

const emit = defineEmits<{
  typeChange: []
  actChange: [id: string | undefined]
}>()

const selectedType = defineModel<ActType | null>('selectedType', { required: true })
const form = defineModel<Partial<CreateFreeMedicalHistory>>('form', { required: true })
</script>

<template>
  <div class="field">
    <label class="field-label">Type d'acte</label>
    <el-select
      v-model="selectedType"
      placeholder="Sélectionner un type"
      size="large"
      style="width: 100%"
      @change="emit('typeChange')"
    >
      <el-option
        v-for="opt in ACT_TYPE_OPTIONS"
        :key="opt.value"
        :label="opt.label"
        :value="opt.value"
      />
    </el-select>
  </div>

  <div class="field">
    <label class="field-label">Acte</label>
    <el-select
      v-model="form.actId"
      placeholder="Sélectionner un acte..."
      size="large"
      style="width: 100%"
      filterable
      :disabled="!selectedType"
      @change="emit('actChange', $event)"
    >
      <el-option v-for="a in actsForSelectedType" :key="a.id" :label="a.name" :value="a.id" />
    </el-select>
    <span v-if="selectedType && actsForSelectedType.length === 0" class="field-hint">
      Aucun acte de ce type dans le catalogue.
    </span>
  </div>
</template>

<style lang="scss" scoped>
.field {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}
.field-label {
  font-size: 13px;
  font-weight: var(--fw-semibold);
  color: var(--el-text-color-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.field-hint {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}
</style>
