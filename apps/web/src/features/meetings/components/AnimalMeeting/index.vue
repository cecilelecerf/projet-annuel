<script setup lang="ts">
import type { AnimalMeetingMeta } from '@armali/schemas'
import { ArrowRight, Check, Delete, Edit } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import 'dayjs/locale/fr'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { calendarApi } from '../../api/calendar.api'
import MeetingActs from './MeetingActs.vue'
import { prescriptionApi } from '@/features/prescriptions/api'
import PrescriptionCard from '@/features/prescriptions/components/PrescriptionCard.vue'
import { useAuthStore } from '@/stores/authStore'
import { ElMessageBox } from 'element-plus'

dayjs.locale('fr')

const { meeting } = defineProps<{ meeting: AnimalMeetingMeta }>()
const router = useRouter()
const { user } = useAuthStore()
const isEditing = ref(false)
const [acts, prescriptions] = await Promise.all([
  calendarApi.meetingActs.getAll(meeting.id),
  prescriptionApi.getByMeeting(meeting.id),
])
const editDescription = ref(meeting.description ?? '')
const editReport = ref(meeting.report ?? '')
const editWeight = ref(meeting.petWeight ?? null)
const editSize = ref(meeting.petSize ?? null)
const editStart = ref(dayjs(meeting.startTime).format('HH:mm:ss'))
const editEnd = ref(dayjs(meeting.endTime).format('HH:mm:ss'))

const dateLabel = computed(() => dayjs(meeting.date).format('dddd D MMMM YYYY'))
const timeLabel = computed(() => {
  const start = dayjs(meeting.startTime).format('H[h]mm')
  const end = dayjs(meeting.endTime).format('H[h]mm')
  return `${start} — ${end}`
})

const petAge = computed(() => {
  if (!meeting.ownedPet?.dateOfBirth) return null
  const years = dayjs().diff(dayjs(meeting.ownedPet.dateOfBirth), 'year')
  const months = dayjs().diff(dayjs(meeting.ownedPet.dateOfBirth), 'month') % 12
  if (years === 0) return `${months} mois`
  if (months === 0) return `${years} an${years > 1 ? 's' : ''}`
  return `${years} an${years > 1 ? 's' : ''} et ${months} mois`
})

const onSave = async () => {
  // TODO: appel API update
  isEditing.value = false
}

const onDelete = async () => {
  try {
    await ElMessageBox.confirm('Cette action est irréversible.', 'Supprimer le rendez-vous ?', {
      confirmButtonText: 'Supprimer',
      cancelButtonText: 'Annuler',
      type: 'warning',
      confirmButtonClass: 'el-button--danger',
    })
    calendarApi.delete(meeting.id)
    router.back()
  } catch {
    // Annulé — ne rien faire
  }
}
</script>

<template>
  <!-- Header -->
  <div class="page-header">
    <el-button text @click="router.back()">
      <el-icon><ArrowLeft /></el-icon>
      Retour
    </el-button>
    <div class="header-actions">
      <el-button
        v-if="!isEditing && user?.role !== 'CLIENT'"
        @click="isEditing = true"
        :icon="Edit"
      >
        Modifier
      </el-button>
      <el-button
        v-if="isEditing && user?.role !== 'CLIENT'"
        type="primary"
        @click="onSave"
        :icon="Check"
      >
        Enregistrer
      </el-button>
      <el-button v-if="isEditing && user?.role !== 'CLIENT'" @click="isEditing = false"
        >Annuler
      </el-button>
      <el-button
        v-if="new Date(meeting.date) > new Date()"
        type="danger"
        plain
        @click="onDelete"
        :icon="Delete"
      >
        Supprimer
      </el-button>
    </div>
  </div>

  <div class="meeting-content">
    <div class="meeting-left">
      <div class="pet-card">
        <div class="pet-avatar">
          {{ meeting.ownedPet?.name?.charAt(0) ?? '?' }}
        </div>
        <div class="pet-section">
          <p class="pet-info">
            <span class="pet-name">{{ meeting.ownedPet?.name }}</span>
            <span class="pet-meta">
              {{ meeting.ownedPet?.race?.pet?.name }} · {{ meeting.ownedPet?.race?.name }}
            </span>
            <span v-if="petAge" class="pet-meta">{{ petAge }}</span>
          </p>
          <el-button text size="small" @click="router.push(`/animals/${meeting.ownedPet?.id}`)">
            Voir la fiche
            <el-icon><ArrowRight /></el-icon>
          </el-button>
        </div>
      </div>
      <div class="pet-card">
        <div class="pet-avatar">
          {{ meeting.ownedPet?.client.picture?.charAt(0) ?? '?' }}
        </div>
        <p class="pet-info">
          <span class="pet-name"
            >{{ meeting.ownedPet?.client?.firstname }}
            {{ meeting.ownedPet?.client?.lastname }}</span
          >
        </p>
        <el-button text size="small" @click="router.push(`/clients/${meeting.ownedPet?.clientId}`)">
          Voir la fiche
          <el-icon><ArrowRight /></el-icon>
        </el-button>
      </div>
    </div>
    <div class="meeting-right">
      <!-- Badge + titre -->
      <div class="section title-section">
        <div class="kind-badge animal">
          <el-icon><FirstAidKit /></el-icon>
          Rendez-vous animal
        </div>
        <h1 class="meeting-title">
          {{ meeting.description ?? 'Consultation' }}
        </h1>
      </div>

      <!-- Date & Horaires -->
      <div class="section">
        <h3 class="section-label">
          <el-icon><Calendar /></el-icon>
          Date & Horaires
        </h3>
        <div v-if="!isEditing" class="info-row">
          <span class="info-value">{{ dateLabel }}</span>
          <span class="info-separator">·</span>
          <span class="info-value">{{ timeLabel }}</span>
        </div>
        <div v-else class="edit-time-row">
          <el-time-picker v-model="editStart" format="HH:mm" value-format="HH:mm:ss" size="large" />
          <span class="time-arrow">→</span>
          <el-time-picker v-model="editEnd" format="HH:mm" value-format="HH:mm:ss" size="large" />
        </div>
      </div>

      <!-- Mesures -->
      <div class="section">
        <h3 class="section-label">
          <el-icon><DataLine /></el-icon>
          Mesures
        </h3>
        <div v-if="!isEditing" class="measures-row">
          <div class="measure-card">
            <span class="measure-label">Poids</span>
            <span class="measure-value">
              {{ meeting.petWeight ? `${meeting.petWeight} kg` : '—' }}
            </span>
          </div>
          <div class="measure-card">
            <span class="measure-label">Taille</span>
            <span class="measure-value">
              {{ meeting.petSize ? `${meeting.petSize} cm` : '—' }}
            </span>
          </div>
        </div>
        <div v-else class="measures-edit-row">
          <div class="measure-edit">
            <label class="edit-label">Poids (kg)</label>
            <el-input-number v-model="editWeight" :precision="2" :step="0.1" size="large" />
          </div>
          <div class="measure-edit">
            <label class="edit-label">Taille (cm)</label>
            <el-input-number v-model="editSize" :precision="2" :step="0.5" size="large" />
          </div>
        </div>
      </div>

      <!-- Spécialité -->
      <!-- <div v-if="meeting.speciality" class="section">
        <h3 class="section-label">
          <el-icon><Medal /></el-icon>
          Spécialité
        </h3>
        <el-tag round>{{ meeting.speciality.name }}</el-tag>
      </div> -->

      <!-- Description -->
      <div class="section">
        <h3 class="section-label">
          <el-icon><Document /></el-icon>
          Motif de consultation
        </h3>
        <el-input
          v-if="isEditing"
          v-model="editDescription"
          type="textarea"
          :rows="3"
          placeholder="Décrire le motif..."
        />
        <p v-else-if="meeting.description" class="description-text">{{ meeting.description }}</p>
        <p v-else class="empty-text">Non renseigné</p>
      </div>

      <!-- Rapport -->
      <div class="section">
        <h3 class="section-label">
          <el-icon><Memo /></el-icon>
          Compte rendu
        </h3>
        <el-input
          v-if="isEditing"
          v-model="editReport"
          type="textarea"
          :rows="5"
          placeholder="Rédiger le compte rendu..."
        />
        <p v-else-if="meeting.report" class="description-text">{{ meeting.report }}</p>
        <p v-else class="empty-text">Aucun compte rendu</p>
      </div>
      <MeetingActs :acts="acts" />
      <div v-if="prescriptions?.length" class="section">
        <h3 class="section-label">
          <el-icon><Document /></el-icon>
          Prescriptions
          <span class="count-badge">{{ prescriptions.length }}</span>
        </h3>
        <div class="prescriptions-list">
          <PrescriptionCard
            v-for="prescription in prescriptions"
            :key="prescription.id"
            :prescription="prescription"
          >
          </PrescriptionCard>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-xl);
}

.header-actions {
  display: flex;
  gap: var(--spacing-sm);
}

.meeting-content {
  display: flex;
  gap: var(--spacing-xl);
  flex-direction: column;
  @include above('lg') {
    flex-direction: row;
  }
}
.meeting-right {
  width: 100%;
  display: flex;
  gap: var(--spacing-xl);
  flex-direction: column;
}
.meeting-left {
  display: flex;
  gap: var(--spacing-md);
  width: 100%;
  @include below('sm') {
    flex-direction: column;
  }
  @include above('lg') {
    flex-direction: column;
    width: 300px;
  }
}

// ── Sections ──────────────────────────────────────────────────────────────────

.section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
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

// ── Title ─────────────────────────────────────────────────────────────────────

.title-section {
  gap: var(--spacing-sm);
}

.kind-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: var(--radius-full);
  font-size: 12px;
  font-weight: var(--fw-semibold);
  width: fit-content;

  &.animal {
    background: var(--el-color-success-light-9);
    color: var(--el-color-success);
    border: 1px solid var(--el-color-success-light-5);
  }
}

.meeting-title {
  font-family: 'Nunito', sans-serif;
  font-size: 28px;
  font-weight: var(--fw-bold);
  color: var(--el-text-color-primary);
  margin: 0;
}

// ── Info ──────────────────────────────────────────────────────────────────────

.info-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.info-value {
  font-size: 15px;
  color: var(--el-text-color-primary);
}

.info-separator {
  color: var(--el-text-color-placeholder);
}

.description-text {
  font-size: 14px;
  color: var(--el-text-color-secondary);
  line-height: 1.6;
  margin: 0;
  white-space: pre-wrap;
}

.empty-text {
  font-size: 13px;
  color: var(--el-text-color-placeholder);
  font-style: italic;
  margin: 0;
}

// ── Pet card ──────────────────────────────────────────────────────────────────

.pet-card {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  border-radius: var(--radius-lg);
  border: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
  width: 100%;
  box-sizing: border-box;
}
.pet-section {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: var(--spacing-sm);
}

.pet-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: var(--el-color-success-light-7);
  color: var(--el-color-success);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: var(--fw-bold);
  flex-shrink: 0;
}

.pet-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin: 0;
}

.pet-name {
  font-size: 15px;
  font-weight: var(--fw-semibold);
  color: var(--el-text-color-primary);
  text-align: center;
}

.pet-meta {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  text-align: center;
}

// ── Mesures ───────────────────────────────────────────────────────────────────

.measures-row {
  display: flex;
  gap: var(--spacing-md);
}

.measure-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: var(--spacing-md);
  background: var(--el-fill-color-light);
  border-radius: var(--radius-md);
  text-align: center;
}

.measure-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.measure-value {
  font-size: 22px;
  font-weight: var(--fw-bold);
  color: var(--el-text-color-primary);
}

.measures-edit-row {
  display: flex;
  gap: var(--spacing-md);
}

.measure-edit {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.edit-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

// ── Time edit ─────────────────────────────────────────────────────────────────

.edit-time-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.time-arrow {
  color: var(--el-text-color-placeholder);
  font-size: 16px;
}

.prescriptions-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);

  @include above('lg') {
    flex-direction: row;
    flex-wrap: wrap;
  }
}
</style>
