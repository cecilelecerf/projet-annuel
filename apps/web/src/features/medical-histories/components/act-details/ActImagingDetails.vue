<script setup lang="ts">
import type { MedicalHistory } from '@armali/schemas'
import { imagingTypeLabel } from '../../utils'

defineProps<{ imaging: NonNullable<MedicalHistory['imaging']> }>()
</script>

<template>
  <div class="act-details">
    <div class="details-grid">
      <div class="detail-item">
        <span class="detail-label">Type</span>
        <span class="detail-value">{{ imagingTypeLabel(imaging.imagingType) }}</span>
      </div>
      <div v-if="imaging.bodyPart" class="detail-item">
        <span class="detail-label">Zone</span>
        <span class="detail-value">{{ imaging.bodyPart }}</span>
      </div>
      <div v-if="imaging.findings" class="detail-item full-width">
        <span class="detail-label">Résultats</span>
        <span class="detail-value">{{ imaging.findings }}</span>
      </div>
      <div v-if="imaging.fileUrl" class="detail-item full-width">
        <span class="detail-label">Fichier</span>
        <el-link :href="imaging.fileUrl" target="_blank" type="primary" class="detail-badge">
          Voir le fichier
        </el-link>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@import '../../styles/act-details';
</style>
