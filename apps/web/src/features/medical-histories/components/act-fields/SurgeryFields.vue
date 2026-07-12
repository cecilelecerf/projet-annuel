<script setup lang="ts">
import type { CreateMedicalHistory } from '@armali/schemas'

const surgery = defineModel<NonNullable<CreateMedicalHistory['surgery']>>('surgery', {
  required: true,
})
</script>

<template>
  <div class="field">
    <label class="field-label">Anesthésie</label>
    <el-select v-model="surgery.anesthesiaType" size="large" style="width: 100%">
      <el-option label="Locale" value="LOCAL" />
      <el-option label="Générale" value="GENERAL" />
      <el-option label="Sédation" value="SEDATION" />
    </el-select>
  </div>
  <div class="field">
    <label class="field-label">Durée (min)</label>
    <el-input-number v-model="surgery.duration" :min="0" size="large" style="width: 100%" />
  </div>
  <div class="field">
    <label class="field-label">Complications</label>
    <el-input v-model="surgery.complications" type="textarea" :rows="2" />
  </div>
  <div class="field">
    <label class="field-label">Instructions post-op</label>
    <el-input v-model="surgery.postOpInstructions" type="textarea" :rows="2" />
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
