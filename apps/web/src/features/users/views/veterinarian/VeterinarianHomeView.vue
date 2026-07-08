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
</script>

<template>
  <div class="page-header">
    <h1>Tableau de bord</h1>
    <p>Vos rendez-vous et votre réputation</p>
  </div>

  <el-skeleton v-if="loading" :rows="4" animated />

  <template v-else-if="dashboard">
    <div class="stats-grid">
      <div class="card stat-card" @click="router.push({ name: 'VETERINARIAN.Calendar' })">
        <span class="stat-label">RDV à venir (7 prochains jours)</span>
        <span class="stat-value">{{ dashboard.upcomingMeetingsCount }}</span>
        <span class="stat-sub">Voir l'agenda →</span>
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
  grid-template-columns: repeat(2, 1fr);
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

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>