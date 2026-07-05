<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  type ChartOptions,
} from 'chart.js'
import { http } from '@/lib/api'
import { useNotify } from '@/composables/useNotify'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend)

const notify = useNotify()

interface WeeklyCount {
  weekStart: string
  count: number
}

const history = ref<WeeklyCount[]>([])
const forecast = ref<WeeklyCount[]>([])
const loading = ref(true)

function formatWeek(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
}

async function load() {
  loading.value = true
  try {
    const data = await http.get<{ history: WeeklyCount[]; forecast: WeeklyCount[] }>(
      '/referent/analytics/visits-forecast',
    )
    history.value = data.history
    forecast.value = data.forecast
  } catch (err: unknown) {
    notify.error(err instanceof Error ? err.message : 'Impossible de charger la prévision')
  } finally {
    loading.value = false
  }
}

onMounted(load)

const chartData = computed(() => {
  const labels = [...history.value, ...forecast.value].map((w) => formatWeek(w.weekStart))
  const historyData = history.value.map((w) => w.count)
  const lastHistory = history.value[history.value.length - 1] as WeeklyCount | undefined
  const bridge = lastHistory?.count ?? null
  const forecastData = [
    ...history.value.map(() => null),
    bridge,
    ...forecast.value.slice(1).map((w) => w.count),
  ]

  return {
    labels,
    datasets: [
      {
        label: 'Historique',
        data: historyData,
        borderColor: 'var(--el-color-primary)',
        backgroundColor: 'var(--el-color-primary)',
        borderWidth: 2,
        pointRadius: 3,
        tension: 0.3,
      },
      {
        label: 'Prévision (estimation)',
        data: forecastData,
        borderColor: 'var(--el-color-primary)',
        backgroundColor: 'var(--el-color-primary)',
        borderWidth: 2,
        borderDash: [6, 4],
        pointRadius: 3,
        tension: 0.3,
      },
    ],
  }
})

const chartOptions: ChartOptions<'line'> = {
  responsive: true,
  interaction: { mode: 'index', intersect: false },
  plugins: {
    legend: { position: 'bottom' },
    tooltip: { mode: 'index', intersect: false },
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: { precision: 0 },
      grid: { color: 'var(--el-border-color-lighter)' },
    },
    x: { grid: { display: false } },
  },
}
</script>

<template>
  <div class="forecast-page">
    <div class="page-header">
      <h1>Prévision du nombre de visites</h1>
      <p>
        Basée sur l'historique des {{ history.length }} dernières semaines, projection des
        {{ forecast.length }} prochaines semaines (régression linéaire simple — à titre indicatif).
      </p>
    </div>

    <div class="card">
      <el-skeleton v-if="loading" :rows="6" animated />
      <div v-else-if="history.length === 0" class="empty">
        Pas encore assez de rendez-vous enregistrés pour établir une prévision.
      </div>
      <div v-else class="chart-wrapper">
        <Line :data="chartData" :options="chartOptions" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.forecast-page {
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
.card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  padding: 24px;
}
.chart-wrapper {
  height: 360px;
}
.empty {
  color: #9ca3af;
  text-align: center;
  padding: 40px 0;
}
</style>
