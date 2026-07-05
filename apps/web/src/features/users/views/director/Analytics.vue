<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  type ChartOptions,
  type TooltipItem,
} from 'chart.js'
import { http } from '@/lib/api'
import { useNotify } from '@/composables/useNotify'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip)

const notify = useNotify()

interface VetRevenue {
  veterinarianId: string
  firstname: string
  lastname: string
  revenue: number
}

interface Overview {
  retention: { totalClients: number; returningClients: number; retentionRate: number }
  profitabilityByVeterinarian: VetRevenue[]
}

const overview = ref<Overview | null>(null)
const loading = ref(true)

async function load() {
  loading.value = true
  try {
    overview.value = await http.get('/director/analytics/overview')
  } catch (err: unknown) {
    notify.error(err instanceof Error ? err.message : 'Impossible de charger les statistiques')
  } finally {
    loading.value = false
  }
}

onMounted(load)

const currencyFormatter = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' })

const chartData = computed(() => {
  const vets = overview.value?.profitabilityByVeterinarian ?? []
  return {
    labels: vets.map((v) => `Dr ${v.lastname}`),
    datasets: [
      {
        label: 'Chiffre d\'affaires généré (12 derniers mois)',
        data: vets.map((v) => v.revenue),
        backgroundColor: 'var(--el-color-primary)',
        borderRadius: 4,
      },
    ],
  }
})

const chartOptions: ChartOptions<'bar'> = {
  responsive: true,
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (ctx: TooltipItem<'bar'>) => currencyFormatter.format(ctx.parsed.y ?? 0),
      },
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: { callback: (v) => currencyFormatter.format(Number(v)) },
      grid: { color: 'var(--el-border-color-lighter)' },
    },
    x: { grid: { display: false } },
  },
}
</script>

<template>
  <div class="analytics-page">
    <div class="page-header">
      <h1>Statistiques de la clinique</h1>
      <p>Taux de rétention clients et chiffre d'affaires généré par vétérinaire</p>
    </div>

    <el-skeleton v-if="loading" :rows="8" animated />

    <template v-else-if="overview">
      <div class="stat-cards">
        <div class="stat-card">
          <div class="stat-value">{{ overview.retention.retentionRate.toFixed(1) }}%</div>
          <div class="stat-label">Taux de rétention clients</div>
          <div class="stat-sub">
            {{ overview.retention.returningClients }} clients fidèles sur
            {{ overview.retention.totalClients }} au total
          </div>
        </div>
      </div>

      <div class="card">
        <h2>Chiffre d'affaires généré par vétérinaire</h2>
        <p class="hint">
          Estimation basée sur les actes réalisés (12 derniers mois) — pas de données de coûts
          disponibles pour calculer une marge nette.
        </p>
        <div v-if="overview.profitabilityByVeterinarian.length === 0" class="empty">
          Aucun vétérinaire dans cette clinique.
        </div>
        <div v-else class="chart-wrapper">
          <Bar :data="chartData" :options="chartOptions" />
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.analytics-page {
  padding: 32px 24px;
}
.page-header {
  margin-bottom: 24px;
}
.page-header h1 {
  font-size: 24px;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0 0 6px;
}
.page-header p {
  color: #6b7280;
  margin: 0;
  font-size: 14px;
}
.stat-cards {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
}
.stat-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  padding: 24px;
  min-width: 260px;
}
.stat-value {
  font-size: 32px;
  font-weight: 700;
  color: var(--el-color-primary);
}
.stat-label {
  font-size: 14px;
  font-weight: 600;
  color: #1a1a1a;
  margin-top: 4px;
}
.stat-sub {
  font-size: 12px;
  color: #9ca3af;
  margin-top: 4px;
}
.card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  padding: 24px;
}
.card h2 {
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0 0 6px;
}
.hint {
  color: #9ca3af;
  font-size: 13px;
  margin: 0 0 20px;
}
.chart-wrapper {
  height: 320px;
}
.empty {
  color: #9ca3af;
  text-align: center;
  padding: 24px 0;
}
</style>
