<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useNotify } from '@/composables/useNotify'
import { dashboardApi } from './../../api/dashboard.api'
import type { SecretaryDashboard } from '@armali/schemas'

const router = useRouter()
const notify = useNotify()

const dashboard = ref<SecretaryDashboard | null>(null)
const loading = ref(false)

async function load() {
  loading.value = true
  try {
    const data = await dashboardApi.get()
    if (data.role !== 'SECRETARY') return
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
    <p>Vue du jour pour votre clinique</p>
  </div>

  <el-skeleton v-if="loading" :rows="4" animated />

  <template v-else-if="dashboard">
    <div class="stats-grid">
      <div
        class="card stat-card"
        :class="{ 'stat-card--alert': dashboard.ordersToPrepareCount > 0 }"
        @click="router.push({ name: 'SECRETARY.Orders' })"
      >
        <span class="stat-label">Commandes à préparer</span>
        <span class="stat-value">{{ dashboard.ordersToPrepareCount }}</span>
      </div>

      <div class="card stat-card" @click="router.push({ name: 'SECRETARY.Orders' })">
        <span class="stat-label">Prêtes à récupérer</span>
        <span class="stat-value">{{ dashboard.ordersReadyForPickupCount }}</span>
      </div>

      <div class="card stat-card" @click="router.push({ name: 'SECRETARY.Calendar' })">
        <span class="stat-label">RDV aujourd'hui</span>
        <span class="stat-value">{{ dashboard.todaysMeetingsCount }}</span>
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
  grid-template-columns: repeat(3, 1fr);
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
  font-size: 30px;
  font-weight: var(--fw-bold);
  color: var(--el-text-color-primary);
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>