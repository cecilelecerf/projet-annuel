<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useNotify } from '@/composables/useNotify'
import { dashboardApi } from '@/features/dashboard/api/dashboard.api'
import type { ReferentDashboard } from '@armali/schemas'

const router = useRouter()
const notify = useNotify()

const dashboard = ref<ReferentDashboard | null>(null)
const loading = ref(false)

async function load() {
  loading.value = true
  try {
    dashboard.value = await dashboardApi.get()
  } catch (err: unknown) {
    notify.error(err instanceof Error ? err.message : 'Impossible de charger le tableau de bord')
  } finally {
    loading.value = false
  }
}

onMounted(load)

function formatCurrency(value: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value)
}
</script>

<template>
  <div class="page-header">
    <div>
      <h1>{{ dashboard?.clinic.name || 'Tableau de bord' }}</h1>
      <p>Vue d'ensemble de votre clinique</p>
    </div>
  </div>

  <el-skeleton v-if="loading" :rows="6" animated />

  <template v-else-if="dashboard">
    <!-- Cartes de synthèse -->
    <div class="stats-grid">
      <div class="card stat-card">
        <span class="stat-label">Chiffre d'affaires</span>
        <span class="stat-value">{{ formatCurrency(dashboard.sales.totalRevenue) }}</span>
      </div>
      <div class="card stat-card">
        <span class="stat-label">Commandes (30 derniers jours)</span>
        <span class="stat-value">{{ dashboard.sales.recentOrdersCount }}</span>
        <span class="stat-sub">{{ dashboard.sales.totalOrdersCount }} au total</span>
      </div>
      <div
        class="card stat-card"
        :class="{ 'stat-card--alert': dashboard.sales.lowStockCount > 0 }"
        @click="router.push({ name: 'REFERENT.Boutique' })"
      >
        <span class="stat-label">Produits en stock bas</span>
        <span class="stat-value">{{ dashboard.sales.lowStockCount }}</span>
        <span v-if="dashboard.sales.lowStockCount > 0" class="stat-sub stat-sub--alert">
          À réapprovisionner →
        </span>
      </div>
      <div class="card stat-card">
        <span class="stat-label">Note moyenne clinique</span>
        <span class="stat-value">
          <template v-if="dashboard.reviews.clinicAverageRating">
            {{ dashboard.reviews.clinicAverageRating }} / 5
          </template>
          <template v-else>—</template>
        </span>
        <span class="stat-sub">{{ dashboard.reviews.totalReviews }} avis reçus</span>
      </div>
    </div>

    <!-- Personnel -->
    <div class="cards-row">
      <div class="card card--half">
        <h2>Personnel</h2>
        <div class="info-grid">
          <div class="info-item">
            <span class="label">Vétérinaires</span>
            <span class="value">{{ dashboard.clinic.veterinarianCount }}</span>
          </div>
          <div class="info-item">
            <span class="label">Secrétaires</span>
            <span class="value">{{ dashboard.clinic.secretaryCount }}</span>
          </div>
        </div>
        <el-button text @click="router.push({ name: 'REFERENT.Staff' })">
          Voir le personnel →
        </el-button>
      </div>

      <!-- Notations par vétérinaire -->
      <div class="card card--half">
        <h2>Notation des vétérinaires</h2>
        <div v-if="dashboard.reviews.veterinarianStats.length === 0" class="no-data">
          Aucun vétérinaire dans la clinique pour le moment.
        </div>
        <div v-else class="vet-stats-list">
          <div
            v-for="vet in dashboard.reviews.veterinarianStats"
            :key="vet.id"
            class="vet-stat-item"
          >
            <span class="vet-name">{{ vet.firstname }} {{ vet.lastname }}</span>
            <div class="vet-rating">
              <template v-if="vet.averageRating !== null">
                <el-rate :model-value="vet.averageRating" disabled allow-half />
                <span class="rating-value">{{ vet.averageRating }}</span>
                <span class="rating-count">({{ vet.reviewCount }})</span>
              </template>
              <span v-else class="no-rating">Aucun avis</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>
</template>

<style scoped>
.page-header {
  margin-bottom: var(--spacing-lg);
}
.page-header h1 {
  font-size: 24px;
  font-weight: var(--fw-bold);
  color: var(--el-text-color-primary);
  margin: 0 0 var(--spacing-xs);
}
.page-header p {
  color: var(--el-text-color-regular);
  margin: 0;
  font-size: 14px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}

/* Le fond, le radius et le padding viennent de la classe globale .card (index.scss) */
.stat-card {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}
.stat-card--alert {
  cursor: pointer;
  border: 1px solid var(--el-color-danger-light-5);
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
.stat-sub--alert {
  color: var(--el-color-danger);
  font-weight: var(--fw-semibold);
}

.cards-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-lg);
}
.card h2 {
  font-size: 15px;
  font-weight: var(--fw-semibold);
  color: var(--el-text-color-primary);
  margin: 0 0 var(--spacing-md);
}
.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-md);
}
.info-item {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}
.label {
  font-size: 11px;
  font-weight: var(--fw-semibold);
  color: var(--el-text-color-secondary);
  text-transform: uppercase;
}
.value {
  font-size: 20px;
  font-weight: var(--fw-bold);
  color: var(--el-text-color-primary);
}

.no-data {
  color: var(--el-text-color-secondary);
  font-size: 14px;
}
.vet-stats-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}
.vet-stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: var(--spacing-sm);
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.vet-stat-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}
.vet-name {
  font-size: 14px;
  font-weight: var(--fw-semibold);
  color: var(--el-text-color-primary);
}
.vet-rating {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}
.rating-value {
  font-size: 13px;
  font-weight: var(--fw-semibold);
  color: var(--el-text-color-primary);
}
.rating-count {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.no-rating {
  font-size: 13px;
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