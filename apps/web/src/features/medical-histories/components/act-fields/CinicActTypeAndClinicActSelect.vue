<script setup lang="ts">
import type { ActType, ClinicAct, CreateMettingMedicalHistory } from '@armali/schemas'
import { ACT_TYPE_OPTIONS } from '@/features/acts/composables/useActForm'

defineProps<{
  actsForSelectedType: ClinicAct[]
  selectedClinicAct: ClinicAct | undefined
  isEditing?: boolean
}>()

const emit = defineEmits<{
  typeChange: []
  clinicActChange: [id: string | undefined]
}>()

const selectedType = defineModel<ActType | null>('selectedType', { required: true })
const form = defineModel<Partial<CreateMettingMedicalHistory>>('form', { required: true })
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
      v-model="form.clinicActId"
      placeholder="Sélectionner un acte..."
      size="large"
      style="width: 100%"
      filterable
      :disabled="!selectedType"
      @change="emit('clinicActChange', $event)"
    >
      <el-option
        v-for="ca in actsForSelectedType"
        :key="ca.id"
        :label="`${ca.act?.name} — ${Number(ca.price).toFixed(2)} €`"
        :value="ca.id"
      />
    </el-select>
    <span v-if="selectedType && actsForSelectedType.length === 0" class="field-hint">
      Aucun acte de ce type n'est tarifé par la clinique.
    </span>
  </div>

  <div class="field">
    <label class="field-label">Prix appliqué (€)</label>
    <el-input-number
      v-model="form.priceApplied"
      :precision="2"
      :step="1"
      :min="0"
      :disabled="isEditing"
      size="large"
      style="width: 100%; border-radius: var(--radius-full); overflow: hidden"
    />
    <span v-if="selectedClinicAct && !isEditing" class="field-hint">
      Prix tarifé par la clinique : {{ Number(selectedClinicAct.price).toFixed(2) }} €
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
