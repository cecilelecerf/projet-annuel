<script setup lang="ts">
import { computed } from 'vue'
import type { RevenuePoint } from '@armali/schemas'

const props = defineProps<{ points: RevenuePoint[] }>()

const WIDTH = 800
const HEIGHT = 240
const PADDING_LEFT = 56
const PADDING_BOTTOM = 32
const PADDING_TOP = 16
const PADDING_RIGHT = 16

const chartWidth = WIDTH - PADDING_LEFT - PADDING_RIGHT
const chartHeight = HEIGHT - PADDING_TOP - PADDING_BOTTOM

const maxRevenue = computed(() => {
  const max = Math.max(...props.points.map((p) => p.revenue), 0)
  return max === 0 ? 1 : max * 1.15 // marge en haut pour ne pas coller au bord
})

function xFor(index: number) {
  if (props.points.length <= 1) return PADDING_LEFT + chartWidth / 2
  return PADDING_LEFT + (index / (props.points.length - 1)) * chartWidth
}
function yFor(revenue: number) {
  return PADDING_TOP + chartHeight - (revenue / maxRevenue.value) * chartHeight
}

const linePath = computed(() =>
  props.points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xFor(i)} ${yFor(p.revenue)}`).join(' '),
)

const areaPath = computed(() => {
  if (props.points.length === 0) return ''
  const line = linePath.value
  const lastX = xFor(props.points.length - 1)
  const firstX = xFor(0)
  const baseline = PADDING_TOP + chartHeight
  return `${line} L ${lastX} ${baseline} L ${firstX} ${baseline} Z`
})

// N'affiche pas plus de ~6 labels sur l'axe X pour éviter le chevauchement
const xLabels = computed(() => {
  const step = Math.max(1, Math.ceil(props.points.length / 6))
  return props.points
    .map((p, i) => ({ ...p, index: i }))
    .filter((_, i) => i % step === 0)
})

const yLabels = computed(() => {
  const steps = 4
  return Array.from({ length: steps + 1 }, (_, i) => {
    const value = (maxRevenue.value / steps) * i
    return { value, y: yFor(value) }
  })
})

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
}
</script>

<template>
  <svg :viewBox="`0 0 ${WIDTH} ${HEIGHT}`" class="revenue-chart" preserveAspectRatio="xMidYMid meet">
    <!-- Grille horizontale + labels Y -->
    <g v-for="label in yLabels" :key="label.value">
      <line
        :x1="PADDING_LEFT"
        :x2="WIDTH - PADDING_RIGHT"
        :y1="label.y"
        :y2="label.y"
        class="grid-line"
      />
      <text :x="PADDING_LEFT - 8" :y="label.y + 4" class="axis-label axis-label--y">
        {{ Math.round(label.value) }} €
      </text>
    </g>

    <!-- Aire + ligne -->
    <path v-if="points.length > 0" :d="areaPath" class="chart-area" />
    <path v-if="points.length > 0" :d="linePath" class="chart-line" />

    <!-- Points -->
    <circle
      v-for="(p, i) in points"
      :key="p.date"
      :cx="xFor(i)"
      :cy="yFor(p.revenue)"
      r="3"
      class="chart-point"
    >
      <title>{{ formatDate(p.date) }} : {{ p.revenue.toFixed(2) }} €</title>
    </circle>

    <!-- Labels X -->
    <text
      v-for="label in xLabels"
      :key="label.date"
      :x="xFor(label.index)"
      :y="HEIGHT - 8"
      class="axis-label axis-label--x"
    >
      {{ formatDate(label.date) }}
    </text>

    <text v-if="points.length === 0" :x="WIDTH / 2" :y="HEIGHT / 2" class="no-data-label">
      Aucune donnée sur cette période
    </text>
  </svg>
</template>

<style scoped>
.revenue-chart {
  width: 100%;
  height: auto;
}
.grid-line {
  stroke: var(--el-border-color-lighter);
  stroke-width: 1;
}
.chart-area {
  fill: var(--el-color-primary-light-8);
  opacity: 0.6;
}
.chart-line {
  fill: none;
  stroke: var(--el-color-primary);
  stroke-width: 2;
}
.chart-point {
  fill: var(--el-color-primary);
}
.axis-label {
  font-size: 10px;
  fill: var(--el-text-color-secondary);
}
.axis-label--y {
  text-anchor: end;
}
.axis-label--x {
  text-anchor: middle;
}
.no-data-label {
  text-anchor: middle;
  font-size: 13px;
  fill: var(--el-text-color-placeholder);
}
</style>