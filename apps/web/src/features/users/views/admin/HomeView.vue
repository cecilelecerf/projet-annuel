<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useNotify } from '@/composables/useNotify'
import { dashboardApi } from './../../api/dashboard.api'
import type { AdminDashboard } from '@armali/schemas'

const router = useRouter()
const notify = useNotify()

const dashboard = ref<AdminDashboard | null>(null)
const loading = ref(false)

async function load() {
  loading.value = true
  try {
    const data = await dashboardApi.get()
    if (data.role !== 'ADMIN') return
    dashboard.value = data
  } catch (err: unknown) {
    notify.error(err instanceof Error ? err.message : 'Impossible de charger le tableau de bord')
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="page-header">
    <h1>Tableau de bord</h1>
    <p>Vue d'ensemble de la plateforme</p>
  </div>

  <el-skeleton v-if="loading" :rows="4" animated />

  <template v-else-if="dashboard">
    <div class="stats-grid">
      <div class="card stat-card" @click="router.push({ name: 'ADMIN.Clinics' })">
        <span class="stat-label">Cliniques</span>
        <span class="stat-value">{{ dashboard.clinicsCount }}</span>
      </div>

      <div class="card stat-card">
        <span class="stat-label">Utilisateurs</span>
        <span class="stat-value">{{ dashboard.usersCount }}</span>
      </div>

      <div
        class="card stat-card"
        :class="{ 'stat-card--alert': dashboard.pendingClinicRequestsCount > 0 }"
        @click="router.push({ name: 'ADMIN.ClinicRequests' })"
      >
        <span class="stat-label">Demandes de clinique en attente</span>
        <span class="stat-value">{{ dashboard.pendingClinicRequestsCount }}</span>
        <span v-if="dashboard.pendingClinicRequestsCount > 0" class="stat-sub stat-sub--alert">
          À traiter →
        </span>
      </div>

      <div
        class="card stat-card"
        :class="{ 'stat-card--alert': dashboard.pendingProductRequestsCount > 0 }"
        @click="router.push({ name: 'ADMIN.ProductRequests' })"
      >
        <span class="stat-label">Demandes de produit en attente</span>
        <span class="stat-value">{{ dashboard.pendingProductRequestsCount }}</span>
        <span v-if="dashboard.pendingProductRequestsCount > 0" class="stat-sub stat-sub--alert">
          À traiter →
        </span>
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
  color: var(--el-text-color-secondary);
  margin: 0;
  font-size: 14px;
}
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--spacing-md);
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
.stat-card--alert {
  border: 1px solid var(--el-color-warning-light-5);
}
.stat-label {
  font-size: 12px;
  font-weight: var(--fw-semibold);
  color: var(--el-text-color-secondary);
  text-transform: uppercase;
  letter-spacing: 0.03em;
}
.stat-value {
  font-size: 28px;
  font-weight: var(--fw-bold);
  color: var(--el-text-color-primary);
}
.stat-sub {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.stat-sub--alert {
  color: var(--el-color-warning);
  font-weight: var(--fw-semibold);
}

@media (max-width: 1024px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
@media (max-width: 480px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>