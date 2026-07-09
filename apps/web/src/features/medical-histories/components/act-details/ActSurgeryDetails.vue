<script setup lang="ts">
import type { MedicalHistory } from '@armali/schemas'
import { anesthesiaLabel } from '../../utils'

defineProps<{ surgery: NonNullable<MedicalHistory['surgery']> }>()
</script>

<template>
  <div class="act-details">
    <div class="details-grid">
      <div class="detail-item">
        <span class="detail-label">Anesthésie</span>
        <span class="detail-value">{{ anesthesiaLabel(surgery.anesthesiaType) }}</span>
      </div>
      <div v-if="surgery.duration" class="detail-item">
        <span class="detail-label">Durée</span>
        <span class="detail-value">{{ surgery.duration }} min</span>
      </div>
      <div v-if="surgery.complications" class="detail-item full-width">
        <span class="detail-label">Complications</span>
        <span class="detail-value">{{ surgery.complications }}</span>
      </div>
      <div v-if="surgery.postOpInstructions" class="detail-item full-width">
        <span class="detail-label">Post-op</span>
        <span class="detail-value">{{ surgery.postOpInstructions }}</span>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '../../styles/act-details';
</style>
