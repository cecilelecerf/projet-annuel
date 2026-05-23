<!-- MeetingActs.vue -->
<script setup lang="ts">
import type { ActType, AnimalMeetingAct } from '@armali/schemas'
import { ref } from 'vue'
import dayjs from 'dayjs'
import 'dayjs/locale/fr'
import { Plus, Edit, Delete } from '@element-plus/icons-vue'

dayjs.locale('fr')

defineProps<{ acts: AnimalMeetingAct[] }>()

const isAddingAct = ref(false)

const actTypeIcon = (type?: ActType) => {
  const icons: Record<string, string> = {
    VACCINATION: 'Syringe',
    SURGERY: 'Scissors',
    HOSPITALIZATION: 'House',
    IMAGING: 'Camera',
    ANALYSIS: 'Odometer',
    NURSING: 'FirstAidKit',
    CONSULTATION: 'ChatDotRound',
  }
  return icons[type ?? ''] ?? 'Document'
}

const actTypeLabel = (type?: ActType) => {
  const labels: Record<string, string> = {
    VACCINATION: 'Vaccination',
    SURGERY: 'Chirurgie',
    HOSPITALIZATION: 'Hospitalisation',
    IMAGING: 'Imagerie',
    ANALYSIS: 'Analyse',
    NURSING: 'Soins infirmiers',
    CONSULTATION: 'Consultation',
  }
  return labels[type ?? ''] ?? type
}

const anesthesiaLabel = (type?: string) =>
  ({
    LOCAL: 'Locale',
    GENERAL: 'Générale',
    SEDATION: 'Sédation',
  })[type ?? ''] ?? type

const imagingTypeLabel = (type?: string) =>
  ({
    XRAY: 'Radiographie',
    ULTRASOUND: 'Échographie',
    SCANNER: 'Scanner',
    MRI: 'IRM',
  })[type ?? ''] ?? type

const analysisTypeLabel = (type?: string) =>
  ({
    BLOOD: 'Prise de sang',
    URINE: 'Urine',
    STOOL: 'Selles',
    BIOPSY: 'Biopsie',
    CYTOLOGY: 'Cytologie',
    OTHER: 'Autre',
  })[type ?? ''] ?? type

const editAct = (act: AnimalMeetingAct) => {
  console.log(act)
  // TODO
}

const deleteAct = async (id: string) => {
  console.log(id)
  // TODO
}
</script>

<template>
  <div class="section">
    <div class="section-label-row">
      <h3 class="section-label">
        <el-icon><List /></el-icon>
        Actes réalisés
        <span class="count-badge">{{ acts?.length ?? 0 }}</span>
      </h3>
      <el-button size="small" type="primary" plain @click="isAddingAct = true">
        <el-icon><Plus /></el-icon>
        Ajouter
      </el-button>
    </div>

    <div v-if="acts?.length" class="acts-list">
      <div v-for="act in acts" :key="act.id" class="act-card">
        <!-- Header -->
        <div class="act-card-header">
          <div class="act-type-badge" :class="`badge-${act.clinicAct?.act?.type?.toLowerCase()}`">
            <el-icon><component :is="actTypeIcon(act.clinicAct?.act?.type)" /></el-icon>
            {{ actTypeLabel(act.clinicAct?.act?.type) }}
          </div>
          <span class="act-price">{{ act.priceApplied }} €</span>
        </div>

        <!-- Body -->
        <div class="act-card-body">
          <span class="act-name">{{ act.clinicAct?.act?.name }}</span>
          <span v-if="act.notes" class="act-notes">{{ act.notes }}</span>
        </div>

        <!-- Performers -->
        <div v-if="act.performedBy?.length" class="act-performers">
          <el-avatar v-for="p in act.performedBy" :key="p.id" :size="24" class="performer-avatar">
            {{ p.veterinarian?.user?.firstname?.charAt(0) }}
          </el-avatar>
          <span class="performers-label">
            {{ act.performedBy.map((p) => `Dr. ${p.veterinarian.user.lastname}`).join(', ') }}
          </span>
        </div>

        <!-- Chirurgie -->
        <div v-if="act.surgery" class="act-details">
          <el-descriptions :column="2" size="small" border>
            <el-descriptions-item label="Anesthésie">
              {{ anesthesiaLabel(act.surgery.anesthesiaType) }}
            </el-descriptions-item>
            <el-descriptions-item v-if="act.surgery.duration" label="Durée">
              {{ act.surgery.duration }} min
            </el-descriptions-item>
            <el-descriptions-item v-if="act.surgery.complications" label="Complications" :span="2">
              {{ act.surgery.complications }}
            </el-descriptions-item>
            <el-descriptions-item v-if="act.surgery.postOpInstructions" label="Post-op" :span="2">
              {{ act.surgery.postOpInstructions }}
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <!-- Imagerie -->
        <div v-if="act.imaging" class="act-details">
          <el-descriptions :column="2" size="small" border>
            <el-descriptions-item label="Type">
              {{ imagingTypeLabel(act.imaging.imagingType) }}
            </el-descriptions-item>
            <el-descriptions-item v-if="act.imaging.bodyPart" label="Zone">
              {{ act.imaging.bodyPart }}
            </el-descriptions-item>
            <el-descriptions-item v-if="act.imaging.findings" label="Résultats" :span="2">
              {{ act.imaging.findings }}
            </el-descriptions-item>
            <el-descriptions-item v-if="act.imaging.fileUrl" label="Fichier" :span="2">
              <el-link :href="act.imaging.fileUrl" target="_blank" type="primary">
                Voir le fichier
              </el-link>
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <!-- Analyse -->
        <div v-if="act.analysis" class="act-details">
          <el-descriptions :column="2" size="small" border>
            <el-descriptions-item label="Type">
              {{ analysisTypeLabel(act.analysis.analysisType) }}
            </el-descriptions-item>
            <el-descriptions-item label="Statut">
              <el-tag
                :type="act.analysis.status === 'RECEIVED' ? 'success' : 'warning'"
                size="small"
                round
              >
                {{ act.analysis.status === 'RECEIVED' ? 'Reçu' : 'En attente' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item v-if="act.analysis.laboratory" label="Laboratoire">
              {{ act.analysis.laboratory }}
            </el-descriptions-item>
            <el-descriptions-item v-if="act.analysis.receivedAt" label="Reçu le">
              {{ dayjs(act.analysis.receivedAt).format('D MMM YYYY') }}
            </el-descriptions-item>
            <el-descriptions-item
              v-if="act.analysis.interpretation"
              label="Interprétation"
              :span="2"
            >
              {{ act.analysis.interpretation }}
            </el-descriptions-item>
            <el-descriptions-item v-if="act.analysis.fileUrl" label="Fichier" :span="2">
              <el-link :href="act.analysis.fileUrl" target="_blank" type="primary">
                Voir les résultats
              </el-link>
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <!-- Hospitalisation -->
        <div v-if="act.hospitalization" class="act-details">
          <el-descriptions :column="2" size="small" border>
            <el-descriptions-item label="Admis le">
              {{ dayjs(act.hospitalization.admittedAt).format('D MMM YYYY') }}
            </el-descriptions-item>
            <el-descriptions-item label="Sorti le">
              {{
                act.hospitalization.dischargedAt
                  ? dayjs(act.hospitalization.dischargedAt).format('D MMM YYYY')
                  : 'En cours'
              }}
            </el-descriptions-item>
            <el-descriptions-item v-if="act.hospitalization.boxNumber" label="Box">
              {{ act.hospitalization.boxNumber }}
            </el-descriptions-item>
          </el-descriptions>

          <div v-if="act.hospitalization.dailyReports?.length" class="daily-reports">
            <p class="daily-reports-label">Rapports journaliers</p>
            <div
              v-for="report in act.hospitalization.dailyReports"
              :key="report.id"
              class="daily-report-row"
            >
              <span class="report-date">{{ dayjs(report.createdAt).format('D MMM') }}</span>
              <span v-if="report.weight" class="report-measure">{{ report.weight }} kg</span>
              <span v-if="report.temperature" class="report-measure">
                {{ report.temperature }}°C
              </span>
              <span class="report-notes">{{ report.notes }}</span>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="act-card-footer">
          <span class="act-date">
            {{ dayjs(act.performedAt).format('D MMM YYYY à H[h]mm') }}
          </span>
          <div class="act-actions">
            <el-button text size="small" @click="editAct(act)">
              <el-icon><Edit /></el-icon>
            </el-button>
            <el-button text size="small" type="danger" @click="deleteAct(act.id)">
              <el-icon><Delete /></el-icon>
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <p v-else class="empty-text">Aucun acte réalisé</p>
  </div>
</template>

<style lang="scss" scoped>
.section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.section-label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.section-label {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: 13px;
  font-weight: var(--fw-semibold);
  color: var(--el-text-color-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0;
}

.count-badge {
  background: var(--el-fill-color);
  border-radius: var(--radius-full);
  padding: 1px 7px;
  font-size: 11px;
  color: var(--el-text-color-secondary);
  font-weight: 400;
  text-transform: none;
  letter-spacing: 0;
}

.acts-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.act-card {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--radius-lg);
  overflow: hidden;
  background: var(--el-bg-color);
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
  gap: 6px;
  font-size: 12px;
  font-weight: var(--fw-semibold);
  padding: 2px 10px;
  border-radius: var(--radius-full);

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
  font-size: 15px;
  font-weight: var(--fw-bold);
  color: var(--el-text-color-primary);
}

.act-card-body {
  padding: var(--spacing-md);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.act-name {
  font-size: 15px;
  font-weight: var(--fw-semibold);
  color: var(--el-text-color-primary);
}

.act-notes {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.act-performers {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: 0 var(--spacing-md) var(--spacing-sm);
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

.act-details {
  padding: var(--spacing-sm) var(--spacing-md);
  border-top: 1px solid var(--el-border-color-lighter);
}

.act-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-xs) var(--spacing-md);
  border-top: 1px solid var(--el-border-color-lighter);
  background: var(--el-fill-color-lighter);
}

.act-date {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

.act-actions {
  display: flex;
  gap: 4px;
}

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
  align-items: center;
  gap: var(--spacing-sm);
  padding: 4px 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
  font-size: 13px;

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
}

.empty-text {
  font-size: 13px;
  color: var(--el-text-color-placeholder);
  font-style: italic;
}
</style>
