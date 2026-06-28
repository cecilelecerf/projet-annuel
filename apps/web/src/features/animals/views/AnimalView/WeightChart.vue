<script setup lang="ts">
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  type ChartOptions,
} from 'chart.js'
import { computed } from 'vue'

const { weightData } = defineProps<{ weightData: { date: string; poids: number }[] }>()

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip)

const chartData = computed(() => ({
  labels: weightData.map((d) => d.date),
  datasets: [
    {
      data: weightData.map((d) => d.poids),
      borderColor: 'var(--el-color-primary)',
      borderWidth: 2,
      pointRadius: 4,
      tension: 0.3,
    },
  ],
}))

const chartOptions: ChartOptions<'line'> = {
  responsive: true,
  plugins: { legend: { display: false } },
  scales: {
    y: {
      ticks: { callback: (v) => `${v} kg` },
      grid: { color: 'var(--el-border-color-lighter)' },
    },
    x: {
      grid: { display: false },
    },
  },
}
</script>

<template>
  <div v-if="weightData.length > 1" class="section">
    <h3 class="section-label">Évolution du poids</h3>
    <div class="chart-wrapper">
      <Line :data="chartData" :options="chartOptions" />
    </div>
  </div>
</template>
