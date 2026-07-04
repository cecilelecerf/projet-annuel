<script setup lang="ts">
import dayjs from 'dayjs'
import 'dayjs/locale/fr'
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, ArrowRight } from '@element-plus/icons-vue'
import type { AnimalId } from '@armali/schemas'
import { animalApi } from '../../api'
import { meetingApi } from '@/features/meetings/api/meeting.api.ts'
import { actTypeLabel } from '@/features/medicalHistories/utils.ts'
import WeightChart from './WeightChart.vue'
import { useAuthStore } from '@/stores/authStore.ts'
dayjs.locale('fr')

const route = useRoute()
const router = useRouter()
const { user } = useAuthStore()
const pet = await animalApi.get(route.params.id as AnimalId)
const [meetings, vaccinesStatus] = await Promise.all([
  meetingApi.animal.getAllByAnimal(pet.id),
  animalApi.getVaccines(route.params.id as AnimalId),
])

const age = computed(() => {
  const years = dayjs().diff(dayjs(pet.dateOfBirth), 'year')
  const months = dayjs().diff(dayjs(pet.dateOfBirth), 'month') % 12
  if (years === 0) return `${months} mois`
  if (months === 0) return `${years} an${years > 1 ? 's' : ''}`
  return `${years} an${years > 1 ? 's' : ''} et ${months} mois`
})

const weightData = computed(
  () =>
    meetings
      ?.filter((m) => m.petWeight != null)
      .sort((a, b) => dayjs(a.meeting?.date).diff(dayjs(b.meeting?.date)))
      .map((m) => ({
        date: dayjs(m.meeting?.date).format('D MMM YY'),
        poids: Number(m.petWeight),
      })) ?? [],
)

const lastWeight = computed(() => {
  const meetingFiler = weightData.value?.filter((m) => m.poids != null)
  const last = meetingFiler.sort((a, b) => dayjs(a.date).diff(dayjs(b.date)))[
    meetingFiler.length - 1
  ]
  return last ? `${last.poids} kg` : '—'
})

const lastSize = computed(() => {
  const filetMeeting = meetings?.filter((m) => m.petSize != null)
  const last = filetMeeting.sort((a, b) => dayjs(a.meeting?.date).diff(dayjs(b.meeting?.date)))[
    filetMeeting.length - 1
  ]
  return last ? `${Number(last.petSize)} cm` : '—'
})
</script>

<template>
  <div class="page-header">
    <el-button text @click="router.back()">
      <el-icon><ArrowLeft /></el-icon>
      Retour
    </el-button>
  </div>

  <div class="animal-content">
    <!-- Sidebar -->
    <div class="animal-left">
      <div class="profile-card">
        <div class="pet-avatar">{{ pet.name.charAt(0) }}</div>
        <h2 class="profile-name">{{ pet.name }}</h2>
        <span class="profile-breed"> {{ pet.race?.pet?.name }} · {{ pet.race?.name }} </span>

        <div class="profile-details">
          <div class="detail-row">
            <span class="detail-label">Âge</span>
            <span class="detail-value">{{ age }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Poids</span>
            <span class="detail-value">{{ lastWeight }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Taille</span>
            <span class="detail-value">{{ lastSize }}</span>
          </div>
          <div v-if="pet.activity" class="detail-row">
            <span class="detail-label">Activité</span>
            <el-rate :model-value="pet.activity / 2" disabled :max="5" />
          </div>
        </div>

        <el-divider />

        <!-- Propriétaire -->
        <div class="owner-row" @click="router.push(`/secretary/users/${pet.clientId}`)">
          <div class="owner-avatar">
            {{ pet.client?.user.firstname?.charAt(0) }}{{ pet.client?.user.lastname?.charAt(0) }}
          </div>
          <div class="owner-info">
            <span class="owner-name">
              {{ pet.client?.user.firstname }} {{ pet.client?.user.lastname }}
            </span>
            <span class="owner-label">Propriétaire</span>
          </div>
          <el-icon><ArrowRight /></el-icon>
        </div>

        <!-- Vétérinaire référent -->
        <div v-if="pet.attendingVeterinarian" class="owner-row">
          <div class="owner-avatar vet">
            {{ pet.attendingVeterinarian?.user?.firstname?.charAt(0) }}
          </div>
          <div class="owner-info">
            <span class="owner-name"> Dr. {{ pet.attendingVeterinarian?.user?.lastname }} </span>
            <span class="owner-label">Vétérinaire référent</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Main -->
    <div class="animal-right">
      <!-- Description -->
      <div v-if="pet.description" class="section">
        <h3 class="section-label">Description</h3>
        <p class="description-text">{{ pet.description }}</p>
      </div>

      <!-- Stats -->
      <div class="stats-grid">
        <div class="stat-card">
          <span class="stat-value">{{ meetings.length ?? 0 }}</span>
          <span class="stat-label">Rendez-vous</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">{{ vaccinesStatus.length }}</span>
          <span class="stat-label">Vaccins</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">{{ pet.animalConditionHealths?.length ?? 0 }}</span>
          <span class="stat-label">Conditions</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">
            {{ vaccinesStatus.filter((v) => !v.isUpToDate).length }}
          </span>
          <span class="stat-label danger">Vaccins à renouveler</span>
        </div>
      </div>

      <WeightChart :weight-data="weightData" />

      <!-- Conditions de santé -->
      <div v-if="pet.animalConditionHealths?.length" class="section">
        <h3 class="section-label">
          Conditions de santé
          <span class="count-badge">{{ pet.animalConditionHealths.length }}</span>
        </h3>
        <div class="conditions-list">
          <div
            v-for="condition in pet.animalConditionHealths"
            :key="condition.id"
            class="condition-card"
          >
            <div class="condition-header">
              <span class="condition-name">{{ condition.healthCondition?.name }}</span>
              <span class="condition-date">
                Diagnostiqué le {{ dayjs(condition.diagnosedAt).format('D MMM YYYY') }}
              </span>
            </div>
            <p v-if="condition.notes" class="condition-notes">{{ condition.notes }}</p>
          </div>
        </div>
      </div>

      <!-- Vaccins -->
      <div class="section">
        <h3 class="section-label">
          Carnet de vaccination
          <span class="count-badge">{{ vaccinesStatus.length }}</span>
        </h3>
        <div v-if="vaccinesStatus.length" class="vaccines-table">
          <div class="vaccines-header">
            <span>Vaccin</span>
            <span>Administré le</span>
            <span>Prochain rappel</span>
            <span>Statut</span>
          </div>
          <div
            v-for="v in vaccinesStatus"
            :key="v.vaccineId"
            class="vaccine-row"
            :class="`status-${v.status.toLowerCase()}`"
          >
            <span class="vaccine-name">{{ v.vaccine?.act?.name }}</span>
            <span class="vaccine-date">
              {{
                v.medicalHistory?.performedAt
                  ? dayjs(v.medicalHistory.performedAt).format('D MMM YYYY')
                  : '—'
              }}
            </span>
            <span class="vaccine-date">
              {{ v.nextDue ? dayjs(v.nextDue).format('D MMM YYYY') : '—' }}
            </span>
            <el-tag
              :type="
                v.status === 'UP_TO_DATE'
                  ? 'success'
                  : v.status === 'OVERDUE'
                    ? 'danger'
                    : v.status === 'MANDATORY_MISSING'
                      ? 'warning'
                      : v.status === 'RECOMMENDED_MISSING'
                        ? 'info'
                        : ''
              "
              size="small"
              round
            >
              {{
                v.status === 'UP_TO_DATE'
                  ? 'À jour'
                  : v.status === 'OVERDUE'
                    ? 'En retard'
                    : v.status === 'MANDATORY_MISSING'
                      ? 'Obligatoire manquant'
                      : v.status === 'RECOMMENDED_MISSING'
                        ? 'Recommandé'
                        : 'Non applicable'
              }}
            </el-tag>
          </div>
        </div>
        <p v-else class="empty-text">Aucun vaccin enregistré</p>
      </div>

      <!-- Historique des RDV -->
      <div class="section">
        <h3 class="section-label">
          Historique des rendez-vous
          <span class="count-badge">{{ meetings.length ?? 0 }}</span>
        </h3>
        <div v-if="meetings?.length" class="meetings-list">
          <div
            v-for="meeting in meetings.sort((a, b) =>
              dayjs(b.meeting?.date).diff(dayjs(a.meeting?.date)),
            )"
            :key="meeting.meeting.id"
            class="meeting-row"
            @click="
              router.push({
                name: `${user?.role.toUpperCase()}.Meetings.Detail`,
                params: { id: meeting.meeting.id },
              })
            "
          >
            <div class="meeting-date">
              <span class="meeting-day">{{ dayjs(meeting.meeting?.date).format('D MMM') }}</span>
              <span class="meeting-year">{{ dayjs(meeting.meeting?.date).format('YYYY') }}</span>
            </div>
            <div class="meeting-info">
              <span class="meeting-desc">{{ meeting.description ?? 'Consultation' }}</span>
              <div class="meeting-acts">
                <el-tag
                  v-for="act in meeting.animalMedicalHistories"
                  :key="act.id"
                  size="small"
                  round
                >
                  {{ actTypeLabel(act.clinicAct?.act?.type) }}
                </el-tag>
              </div>
            </div>
            <div class="meeting-meta">
              <span v-if="meeting.petWeight" class="meeting-measure">
                {{ Number(meeting.petWeight) }} kg
              </span>
            </div>
            <el-icon><ArrowRight /></el-icon>
          </div>
        </div>
        <p v-else class="empty-text">Aucun rendez-vous</p>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.animal-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);

  @include above('lg') {
    flex-direction: row;
    align-items: flex-start;
  }
}

// ── Sidebar ───────────────────────────────────────────────────────────────────

.animal-left {
  width: 100%;

  @include above('lg') {
    width: 280px;
    flex-shrink: 0;
  }
}

.profile-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-xl) var(--spacing-lg);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--radius-xl);
  background: var(--el-bg-color);
  box-sizing: border-box;
  width: 100%;
}

.pet-avatar {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: var(--el-color-success-light-7);
  color: var(--el-color-success);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  font-weight: var(--fw-bold);
}

.profile-name {
  font-size: 22px;
  font-weight: var(--fw-bold);
  color: var(--el-text-color-primary);
  margin: 0;
}

.profile-breed {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.profile-details {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  width: 100%;
  margin-top: var(--spacing-sm);
}

.detail-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13px;
}

.detail-label {
  color: var(--el-text-color-secondary);
}

.detail-value {
  font-weight: var(--fw-semibold);
  color: var(--el-text-color-primary);
}

.owner-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  width: 100%;
  cursor: pointer;
  padding: var(--spacing-xs) 0;
  border-radius: var(--radius-md);
  transition: background 0.15s;

  &:hover {
    background: var(--el-fill-color-light);
  }
}

.owner-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--el-color-primary-light-7);
  color: var(--el-color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: var(--fw-bold);
  flex-shrink: 0;

  &.vet {
    background: var(--el-color-purple-light-9);
    color: var(--el-color-purple);
  }
}

.owner-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.owner-name {
  font-size: 13px;
  font-weight: var(--fw-semibold);
  color: var(--el-text-color-primary);
}

.owner-label {
  font-size: 11px;
  color: var(--el-text-color-secondary);
}

// ── Main ──────────────────────────────────────────────────────────────────────

.animal-right {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
  min-width: 0;
}

// ── Stats ─────────────────────────────────────────────────────────────────────

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-sm);

  @include above('sm') {
    grid-template-columns: repeat(4, 1fr);
  }
}

.stat-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: var(--spacing-md);
  background: var(--el-fill-color-light);
  border-radius: var(--radius-lg);
  text-align: center;
}

.stat-value {
  font-size: 28px;
  font-weight: var(--fw-bold);
  color: var(--el-text-color-primary);
}

.stat-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  text-transform: uppercase;
  letter-spacing: 0.04em;

  &.danger {
    color: var(--el-color-danger);
  }
}

// ── Chart ─────────────────────────────────────────────────────────────────────

.chart-wrapper {
  background: var(--el-fill-color-light);
  border-radius: var(--radius-lg);
  padding: var(--spacing-md);
}

// ── Conditions ────────────────────────────────────────────────────────────────

.conditions-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.condition-card {
  padding: var(--spacing-md);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--radius-lg);
  background: var(--el-bg-color);
}

.condition-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
}

.condition-name {
  font-size: 14px;
  font-weight: var(--fw-semibold);
  color: var(--el-text-color-primary);
}

.condition-date {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.condition-notes {
  margin: var(--spacing-xs) 0 0;
  font-size: 13px;
  color: var(--el-text-color-secondary);
  line-height: 1.5;
}

// ── Vaccins ───────────────────────────────────────────────────────────────────

.vaccines-table {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.vaccines-header {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr;
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--el-fill-color-light);
  font-size: 12px;
  font-weight: var(--fw-semibold);
  color: var(--el-text-color-secondary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.vaccine-row {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr;
  align-items: center;
  padding: var(--spacing-sm) var(--spacing-md);
  border-bottom: 1px solid var(--el-border-color-lighter);
  font-size: 13px;

  &:last-child {
    border-bottom: none;
  }
}

.vaccine-name {
  font-weight: var(--fw-semibold);
  color: var(--el-text-color-primary);
}

.vaccine-date {
  color: var(--el-text-color-secondary);
}

// ── Meetings ──────────────────────────────────────────────────────────────────

.meetings-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.meeting-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-sm) var(--spacing-md);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--radius-md);
  background: var(--el-bg-color);
  cursor: pointer;
  transition: background 0.15s;

  &:hover {
    background: var(--el-fill-color-light);
  }
}

.meeting-date {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 44px;
}

.meeting-day {
  font-size: 14px;
  font-weight: var(--fw-bold);
  color: var(--el-color-primary);
}

.meeting-year {
  font-size: 11px;
  color: var(--el-text-color-placeholder);
}

.meeting-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.meeting-desc {
  font-size: 13px;
  font-weight: var(--fw-semibold);
  color: var(--el-text-color-primary);
}

.meeting-acts {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.meeting-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
}

.meeting-measure {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

// ── Description ───────────────────────────────────────────────────────────────

.empty-text {
  font-size: 13px;
  color: var(--el-text-color-placeholder);
  font-style: italic;
  margin: 0;
}
</style>
