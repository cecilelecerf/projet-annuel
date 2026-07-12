<script setup lang="ts">
import type { CreateMedicalHistory } from '@armali/schemas'

const hospitalization = defineModel<NonNullable<CreateMedicalHistory['hospitalization']>>(
  'hospitalization',
  { required: true },
)
</script>

<template>
  <div class="field">
    <label class="field-label">Date d'admission</label>
    <el-date-picker
      v-model="hospitalization.admittedAt"
      type="datetime"
      format="DD/MM/YYYY HH:mm"
      size="large"
      style="width: 100%"
    />
  </div>
  <div class="field">
    <label class="field-label">Numéro de box</label>
    <el-input v-model="hospitalization.boxNumber" size="large" placeholder="Ex: B12" />
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
</style>
