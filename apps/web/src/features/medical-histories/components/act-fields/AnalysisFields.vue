<script setup lang="ts">
import type { CreateMedicalHistory } from '@armali/schemas'

const analysis = defineModel<NonNullable<CreateMedicalHistory['analysis']>>('analysis', {
  required: true,
})
</script>

<template>
  <div class="field">
    <label class="field-label">Type d'analyse</label>
    <el-select v-model="analysis.analysisType" size="large" style="width: 100%">
      <el-option label="Prise de sang" value="BLOOD" />
      <el-option label="Urine" value="URINE" />
      <el-option label="Selles" value="STOOL" />
      <el-option label="Biopsie" value="BIOPSY" />
      <el-option label="Cytologie" value="CYTOLOGY" />
      <el-option label="Autre" value="OTHER" />
    </el-select>
  </div>
  <div class="field">
    <label class="field-label">Laboratoire</label>
    <el-input v-model="analysis.laboratory" size="large" placeholder="Nom du laboratoire..." />
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
