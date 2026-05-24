<script setup lang="ts">
import { useAuthStore } from '@/stores/authStore'
import type { AnimalMeetingAct } from '@armali/schemas'
import dayjs from 'dayjs'
import {
  actTypeIcon,
  actTypeLabel,
  analysisTypeLabel,
  anesthesiaLabel,
  imagingTypeLabel,
} from '../utils'
defineProps<{ act: AnimalMeetingAct }>()

const { user } = useAuthStore()
const emit = defineEmits<{ edit: []; delete: [] }>()
</script>
<template>
  <div class="act-card">
    <!-- Header -->
    <div>
      <div class="act-card-header">
        <div class="act-type-badge" :class="`badge-${act.clinicAct?.act?.type?.toLowerCase()}`">
          <el-icon><component :is="actTypeIcon(act.clinicAct?.act?.type)" /></el-icon>
          <span>{{ actTypeLabel(act.clinicAct?.act?.type) }}</span>
        </div>
        <span class="act-price">{{ Number(act.priceApplied).toFixed(2) }} €</span>
      </div>

      <!-- Body -->
      <div class="act-card-body">
        <span class="act-name">{{ act.clinicAct?.act?.name }}</span>
        <span v-if="act.notes" class="act-notes">{{ act.notes }}</span>
      </div>

      <!-- Performers -->
      <div v-if="act.performedBy?.length" class="act-performers">
        <div class="performers-avatars">
          <el-avatar v-for="p in act.performedBy" :key="p.id" :size="24" class="performer-avatar">
            {{ p.veterinarian?.user?.firstname?.charAt(0) }}
          </el-avatar>
        </div>
        <span class="performers-label">
          {{ act.performedBy.map((p) => `Dr. ${p.veterinarian.user.lastname}`).join(', ') }}
        </span>
      </div>

      <!-- Chirurgie -->
      <div v-if="act.surgery" class="act-details">
        <div class="details-grid">
          <div class="detail-item">
            <span class="detail-label">Anesthésie</span>
            <span class="detail-value">{{ anesthesiaLabel(act.surgery.anesthesiaType) }}</span>
          </div>
          <div v-if="act.surgery.duration" class="detail-item">
            <span class="detail-label">Durée</span>
            <span class="detail-value">{{ act.surgery.duration }} min</span>
          </div>
          <div v-if="act.surgery.complications" class="detail-item full-width">
            <span class="detail-label">Complications</span>
            <span class="detail-value">{{ act.surgery.complications }}</span>
          </div>
          <div v-if="act.surgery.postOpInstructions" class="detail-item full-width">
            <span class="detail-label">Post-op</span>
            <span class="detail-value">{{ act.surgery.postOpInstructions }}</span>
          </div>
        </div>
      </div>

      <!-- Imagerie -->
      <div v-if="act.imaging" class="act-details">
        <div class="details-grid">
          <div class="detail-item">
            <span class="detail-label">Type</span>
            <span class="detail-value">{{ imagingTypeLabel(act.imaging.imagingType) }}</span>
          </div>
          <div v-if="act.imaging.bodyPart" class="detail-item">
            <span class="detail-label">Zone</span>
            <span class="detail-value">{{ act.imaging.bodyPart }}</span>
          </div>
          <div v-if="act.imaging.findings" class="detail-item full-width">
            <span class="detail-label">Résultats</span>
            <span class="detail-value">{{ act.imaging.findings }}</span>
          </div>
          <div v-if="act.imaging.fileUrl" class="detail-item full-width">
            <span class="detail-label">Fichier</span>
            <el-link
              :href="act.imaging.fileUrl"
              target="_blank"
              type="primary"
              class="detail-badge"
            >
              Voir le fichier
            </el-link>
          </div>
        </div>
      </div>

      <!-- Analyse -->
      <div v-if="act.analysis" class="act-details">
        <div class="details-grid">
          <div class="detail-item">
            <span class="detail-label">Type</span>
            <span class="detail-value">{{ analysisTypeLabel(act.analysis.analysisType) }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Statut</span>
            <el-tag
              :type="act.analysis.status === 'RECEIVED' ? 'success' : 'warning'"
              size="small"
              round
              class="detail-badge"
            >
              {{ act.analysis.status === 'RECEIVED' ? 'Reçu' : 'En attente' }}
            </el-tag>
          </div>
          <div v-if="act.analysis.laboratory" class="detail-item">
            <span class="detail-label">Laboratoire</span>
            <span class="detail-value">{{ act.analysis.laboratory }}</span>
          </div>
          <div v-if="act.analysis.receivedAt" class="detail-item">
            <span class="detail-label">Reçu le</span>
            <span class="detail-value">{{
              dayjs(act.analysis.receivedAt).format('D MMM YYYY')
            }}</span>
          </div>
          <div v-if="act.analysis.interpretation" class="detail-item full-width">
            <span class="detail-label">Interprétation</span>
            <span class="detail-value">{{ act.analysis.interpretation }}</span>
          </div>
          <div v-if="act.analysis.fileUrl" class="detail-item full-width">
            <span class="detail-label">Fichier</span>
            <el-link
              :href="act.analysis.fileUrl"
              target="_blank"
              type="primary"
              class="detail-badge"
            >
              Voir les résultats
            </el-link>
          </div>
        </div>
      </div>

      <!-- Hospitalisation -->
      <div v-if="act.hospitalization" class="act-details">
        <div class="details-grid">
          <div class="detail-item">
            <span class="detail-label">Admis le</span>
            <span class="detail-value">{{
              dayjs(act.hospitalization.admittedAt).format('D MMM YYYY')
            }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Sorti le</span>
            <span class="detail-value">
              {{
                act.hospitalization.dischargedAt
                  ? dayjs(act.hospitalization.dischargedAt).format('D MMM YYYY')
                  : 'En cours'
              }}
            </span>
          </div>
          <div v-if="act.hospitalization.boxNumber" class="detail-item">
            <span class="detail-label">Box</span>
            <span class="detail-value">{{ act.hospitalization.boxNumber }}</span>
          </div>
        </div>

        <div v-if="act.hospitalization.dailyReports?.length" class="daily-reports">
          <p class="daily-reports-label">Rapports journaliers</p>
          <div
            v-for="report in act.hospitalization.dailyReports"
            :key="report.id"
            class="daily-report-row"
          >
            <span class="report-date">{{ dayjs(report.createdAt).format('D MMM') }}</span>
            <span v-if="report.weight" class="report-measure">{{ report.weight }} kg</span>
            <span v-if="report.temperature" class="report-measure">{{ report.temperature }}°C</span>
            <span class="report-notes">{{ report.notes }}</span>
          </div>
        </div>
      </div>
    </div>
    <!-- Footer -->
    <div class="act-card-footer" v-if="user?.role === 'VETERINARIAN'">
      <span class="act-date">
        {{ dayjs(act.performedAt).format('D MMM YYYY à H[h]mm') }}
      </span>
      <div class="act-actions">
        <el-button text size="small" @click="emit('edit')">
          <el-icon><Edit /></el-icon>
        </el-button>
        <el-button text size="small" type="danger" @click="emit('delete')">
          <el-icon><Delete /></el-icon>
        </el-button>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.act-card {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--radius-lg);
  overflow: hidden;
  background: var(--el-bg-color);
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  // min-width: 300px;
  width: 100%;
  @include above('lg') {
    // max-width: 400px;
  }
}

.act-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--el-fill-color-light);
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.act-type-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: var(--fw-semibold);
  padding: 2px 8px;
  border-radius: var(--radius-full);

  @include above('sm') {
    font-size: 12px;
    gap: 6px;
    padding: 2px 10px;
  }

  &.badge-surgery {
    background: var(--el-color-danger-light-9);
    color: var(--el-color-danger);
  }
  &.badge-vaccination {
    background: var(--el-color-success-light-9);
    color: var(--el-color-success);
  }
  &.badge-analysis {
    background: var(--el-color-warning-light-9);
    color: var(--el-color-warning);
  }
  &.badge-imaging {
    background: var(--el-color-primary-light-9);
    color: var(--el-color-primary);
  }
  &.badge-hospitalization {
    background: var(--el-color-info-light-9);
    color: var(--el-color-info);
  }
  &.badge-nursing {
    background: var(--el-color-success-light-9);
    color: var(--el-color-success);
  }
  &.badge-consultation {
    background: var(--el-fill-color);
    color: var(--el-text-color-secondary);
  }
}

.act-price {
  font-size: 14px;
  font-weight: var(--fw-bold);
  color: var(--el-text-color-primary);

  @include above('sm') {
    font-size: 15px;
  }
}

.act-card-body {
  padding: var(--spacing-sm) var(--spacing-md);
  display: flex;
  flex-direction: column;
  gap: 4px;

  @include above('sm') {
    padding: var(--spacing-md);
  }
}

.act-name {
  font-size: 14px;
  font-weight: var(--fw-semibold);
  color: var(--el-text-color-primary);

  @include above('sm') {
    font-size: 15px;
  }
}

.act-notes {
  font-size: 12px;
  color: var(--el-text-color-secondary);

  @include above('sm') {
    font-size: 13px;
  }
}

// ── Performers ────────────────────────────────────────────────────────────────

.act-performers {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: 0 var(--spacing-md) var(--spacing-sm);
  flex-wrap: wrap;
}

.performers-avatars {
  display: flex;
  gap: 2px;
}

.performer-avatar {
  background: var(--el-color-primary-light-7);
  color: var(--el-color-primary);
  font-size: 11px;
  font-weight: var(--fw-bold);
}

.performers-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

// ── Détails ───────────────────────────────────────────────────────────────────

.act-details {
  padding: var(--spacing-sm) var(--spacing-md);
  border-top: 1px solid var(--el-border-color-lighter);
}

.details-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-sm);

  @include above('sm') {
    grid-template-columns: repeat(2, 1fr);
  }
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 2px;

  &.full-width {
    grid-column: 1 / -1;
  }
}

.detail-label {
  font-size: 11px;
  font-weight: var(--fw-semibold);
  color: var(--el-text-color-secondary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.detail-badge {
  width: fit-content;
}

.detail-value {
  font-size: 13px;
  color: var(--el-text-color-primary);
  width: fit-content;
}

// ── Footer ────────────────────────────────────────────────────────────────────

.act-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-xs) var(--spacing-md);
  border-top: 1px solid var(--el-border-color-lighter);
  background: var(--el-fill-color-lighter);
}

.act-date {
  font-size: 11px;
  color: var(--el-text-color-placeholder);

  @include above('sm') {
    font-size: 12px;
  }
}

.act-actions {
  display: flex;
  gap: 4px;
}

// ── Rapports journaliers ──────────────────────────────────────────────────────

.daily-reports {
  margin-top: var(--spacing-sm);
}

.daily-reports-label {
  font-size: 12px;
  font-weight: var(--fw-semibold);
  color: var(--el-text-color-secondary);
  margin: 0 0 var(--spacing-xs);
}

.daily-report-row {
  display: flex;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
  padding: 6px 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
  font-size: 12px;

  @include above('sm') {
    font-size: 13px;
    flex-wrap: nowrap;
    align-items: center;
  }

  &:last-child {
    border-bottom: none;
  }
}

.report-date {
  font-weight: var(--fw-semibold);
  color: var(--el-text-color-primary);
  min-width: 50px;
}

.report-measure {
  color: var(--el-text-color-secondary);
  min-width: 60px;
}

.report-notes {
  flex: 1;
  color: var(--el-text-color-secondary);
  width: 100%;

  @include above('sm') {
    width: auto;
  }
}
</style>
