<script setup lang="ts">
import dayjs from 'dayjs'
import type { MedicalHistory } from '@armali/schemas'
import { analysisTypeLabel } from '../../utils'
import DocumentUpload from '../DocumentUpload.vue'

defineProps<{ analysis: NonNullable<MedicalHistory['analysis']>; medicalHistoryId: string }>()
</script>

<template>
  <div class="act-details">
    <div class="details-grid">
      <div class="detail-item">
        <span class="detail-label">Type</span>
        <span class="detail-value">{{ analysisTypeLabel(analysis.analysisType) }}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">Statut</span>
        <el-tag
          :type="analysis.status === 'RECEIVED' ? 'success' : 'warning'"
          size="small"
          round
          class="detail-badge"
        >
          {{ analysis.status === 'RECEIVED' ? 'Reçu' : 'En attente' }}
        </el-tag>
      </div>
      <div v-if="analysis.laboratory" class="detail-item">
        <span class="detail-label">Laboratoire</span>
        <span class="detail-value">{{ analysis.laboratory }}</span>
      </div>
      <div v-if="analysis.receivedAt" class="detail-item">
        <span class="detail-label">Reçu le</span>
        <span class="detail-value">{{ dayjs(analysis.receivedAt).format('D MMM YYYY') }}</span>
      </div>
      <div v-if="analysis.interpretation" class="detail-item full-width">
        <span class="detail-label">Interprétation</span>
        <span class="detail-value">{{ analysis.interpretation }}</span>
      </div>
      <div v-if="analysis.fileUrl" class="detail-item full-width">
        <span class="detail-label">Fichier</span>
        <el-link :href="analysis.fileUrl" target="_blank" type="primary" class="detail-badge">
          Voir les résultats
        </el-link>
      </div>
    </div>
  </div>
  <DocumentUpload :medical-history-id="medicalHistoryId" />
</template>

<style lang="scss" scoped>
@use '../../styles/act-details';
</style>
