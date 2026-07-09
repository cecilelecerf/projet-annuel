<script setup lang="ts">
import type { CreateMedicalHistory } from '@armali/schemas'

const imaging = defineModel<NonNullable<CreateMedicalHistory['imaging']>>('imaging', {
  required: true,
})
</script>

<template>
  <div class="field">
    <label class="field-label">Type d'imagerie</label>
    <el-select v-model="imaging.imagingType" size="large" style="width: 100%">
      <el-option label="Radiographie" value="XRAY" />
      <el-option label="Échographie" value="ULTRASOUND" />
      <el-option label="Scanner" value="SCANNER" />
      <el-option label="IRM" value="MRI" />
    </el-select>
  </div>
  <div class="field">
    <label class="field-label">Zone</label>
    <el-input v-model="imaging.bodyPart" size="large" placeholder="Ex: thorax, abdomen..." />
  </div>
  <div class="field">
    <label class="field-label">Résultats</label>
    <el-input v-model="imaging.findings" type="textarea" :rows="3" />
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
