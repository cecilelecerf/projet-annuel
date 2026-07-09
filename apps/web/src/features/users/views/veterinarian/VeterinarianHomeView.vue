<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useNotify } from '@/composables/useNotify'
import { dashboardApi } from './../../api/dashboard.api'
import type { VeterinarianDashboard } from '@armali/schemas'

const router = useRouter()
const notify = useNotify()

const dashboard = ref<VeterinarianDashboard | null>(null)
const loading = ref(false)

async function load() {
  loading.value = true
  try {
    const data = await dashboardApi.get()
    if (data.role !== 'VETERINARIAN') return
    dashboard.value = data
  } catch (err: unknown) {
    notify.error(err instanceof Error ? err.message : 'Impossible de charger le tableau de bord')
  } finally {
    loading.value = false
  }
}

onMounted(load)

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('fr-FR', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}
</script>

<template>
  <div class="page-header">
    <h1>Tableau de bord</h1>
    <p>Vos rendez-vous et votre réputation</p>
  </div>

  <el-skeleton v-if="loading" :rows="6" animated />

  <template v-else-if="dashboard">
    <!-- Cartes de synthèse -->
    <div class="stats-grid">
      <div class="card stat-card" @click="router.push({ name: 'VETERINARIAN.Calendar' })">
        <span class="stat-label">RDV aujourd'hui</span>
        <span class="stat-value">{{ dashboard.todaysMeetingsCount }}</span>
      </div>
      <div class="card stat-card" @click="router.push({ name: 'VETERINARIAN.Calendar' })">
        <span class="stat-label">RDV cette semaine</span>
        <span class="stat-value">{{ dashboard.upcomingMeetingsCount }}</span>
      </div>
      <div class="card stat-card">
        <span class="stat-label">Patients suivis</span>
        <span class="stat-value">{{ dashboard.patientsCount }}</span>
      </div>
      <div class="card stat-card">
        <span class="stat-label">Ma note moyenne</span>
        <span class="stat-value">
          <template v-if="dashboard.rating.average !== null">
            {{ dashboard.rating.average }} / 5
          </template>
          <template v-else>—</template>
        </span>
        <span class="stat-sub">{{ dashboard.rating.count }} avis reçus</span>
      </div>
    </div>

    <!-- Raccourcis rapides -->
    <div class="quick-links">
      <el-button @click="router.push({ name: 'VETERINARIAN.Calendar' })">Mon agenda</el-button>
      <el-button @click="router.push({ name: 'VETERINARIAN.Availability' })">
        Mes disponibilités
      </el-button>
      <el-button @click="router.push({ name: 'VETERINARIAN.Messagerie' })">Messagerie</el-button>
    </div>

    <div class="cards-row">
      <!-- Prochains RDV -->
      <div class="card card--half">
        <h2>Prochains rendez-vous</h2>
        <div v-if="dashboard.upcomingMeetings.length === 0" class="no-data">
          Aucun rendez-vous à venir cette semaine.
        </div>
        <div v-else class="meeting-list">
          <div
            v-for="(meeting, i) in dashboard.upcomingMeetings"
            :key="i"
            class="meeting-item"
            @click="router.push({ name: 'VETERINARIAN.Calendar' })"
          >
            <div class="meeting-time">{{ formatDateTime(meeting.date) }}</div>
            <div class="meeting-info">
              <strong>{{ meeting.animalName }}</strong>
              <span class="meeting-client">{{ meeting.clientName }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Derniers avis -->
      <div class="card card--half">
        <h2>Derniers avis reçus</h2>
        <div v-if="dashboard.recentReviews.length === 0" class="no-data">
          Aucun avis pour le moment.
        </div>
        <div v-else class="review-list">
          <div v-for="(review, i) in dashboard.recentReviews" :key="i" class="review-item">
            <div class="review-header">
              <el-rate :model-value="review.rating" disabled size="small" />
              <span class="review-date">{{ formatDate(review.date) }}</span>
            </div>
            <p v-if="review.comment" class="review-comment">{{ review.comment }}</p>
            <span class="review-client">{{ review.clientName }}</span>
          </div>
        </div>
      </div>
    </div>
  </template>
</template>

<style scoped>
.page-header {
  margin-bottom: var(--spacing-sm);
}
.page-header h1 {
  font-size: 24px;
  font-weight: var(--fw-bold);
  color: var(--el-text-color-primary);
  margin: 0 0 var(--spacing-xs);
}
.page-header p {
  color: var(--el-text-color-secondary);
  margin: 0;
  font-size: 14px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-md);
}
.stat-card {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  cursor: pointer;
  transition: transform 0.15s ease;
}
.stat-card:hover {
  transform: translateY(-2px);
}
.stat-label {
  font-size: 12px;
  font-weight: var(--fw-semibold);
  color: var(--el-text-color-secondary);
  text-transform: uppercase;
  letter-spacing: 0.03em;
}
.stat-value {
  font-size: 26px;
  font-weight: var(--fw-bold);
  color: var(--el-text-color-primary);
}
.stat-sub {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.quick-links {
  display: flex;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
}

.cards-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-md);
}
.card h2 {
  font-size: 15px;
  font-weight: var(--fw-semibold);
  color: var(--el-text-color-primary);
  margin: 0 0 var(--spacing-md);
}
.no-data {
  color: var(--el-text-color-secondary);
  font-size: 14px;
}

.meeting-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}
.meeting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: var(--spacing-sm);
  border-bottom: 1px solid var(--el-border-color-lighter);
  cursor: pointer;
}
.meeting-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}
.meeting-time {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
}
.meeting-info {
  display: flex;
  flex-direction: column;
  text-align: right;
}
.meeting-client {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.review-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}
.review-item {
  padding-bottom: var(--spacing-sm);
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.review-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}
.review-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-xs);
}
.review-date {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.review-comment {
  font-size: 13px;
  color: var(--el-text-color-regular);
  margin: 0 0 var(--spacing-xs);
  line-height: 1.5;
}
.review-client {
  font-size: 12px;
  font-weight: var(--fw-semibold);
  color: var(--el-text-color-secondary);
}

@media (max-width: 1024px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .cards-row {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 480px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>