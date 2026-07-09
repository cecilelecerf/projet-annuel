<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useNotify } from '@/composables/useNotify'
import { salesApi } from '@/features/sales/api/sales.api'
import RevenueChart from '@/features/sales/components/RevenueChart.vue'
import type { SalesReport } from '@armali/schemas'

const notify = useNotify()

const report = ref<SalesReport | null>(null)
const loading = ref(false)

type Period = 'today' | 'week' | 'month' | 'custom'
const period = ref<Period>('month')
const customRange = ref<[Date, Date] | null>(null)

function computeRange(p: Period): { from?: string; to?: string } {
  const now = new Date()
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())

  if (p === 'today') {
    return { from: startOfDay(now).toISOString(), to: now.toISOString() }
  }
  if (p === 'week') {
    const start = new Date(now)
    start.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1)) // lundi
    return { from: startOfDay(start).toISOString(), to: now.toISOString() }
  }
  if (p === 'month') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    return { from: start.toISOString(), to: now.toISOString() }
  }
  if (p === 'custom' && customRange.value) {
    return {
      from: startOfDay(customRange.value[0]).toISOString(),
      to: customRange.value[1].toISOString(),
    }
  }
  return {}
}

async function load() {
  loading.value = true
  try {
    const { from, to } = computeRange(period.value)
    report.value = await salesApi.getReport(from, to)
  } catch (err: unknown) {
    notify.error(err instanceof Error ? err.message : 'Impossible de charger les ventes')
  } finally {
    loading.value = false
  }
}

onMounted(load)

function selectPeriod(p: Period) {
  period.value = p
  if (p !== 'custom') load()
}

function onCustomRangeChange() {
  if (customRange.value) load()
}

const orderStatusLabel: Record<string, string> = {
  CONFIRMED: 'Confirmée',
  READY: 'Prête',
  PICKED_UP: 'Récupérée',
}
</script>

<template>
  <div class="page-header">
    <div>
      <h1>Ventes</h1>
      <p>Chiffre d'affaires et historique des ventes de votre clinique</p>
    </div>
  </div>

  <!-- Filtre de période -->
  <div class="period-filters">
    <button
      v-for="p in (['today', 'week', 'month'] as const)"
      :key="p"
      class="period-pill"
      :class="{ 'period-pill--active': period === p }"
      @click="selectPeriod(p)"
    >
      {{ p === 'today' ? "Aujourd'hui" : p === 'week' ? 'Cette semaine' : 'Ce mois' }}
    </button>
    <button
      class="period-pill"
      :class="{ 'period-pill--active': period === 'custom' }"
      @click="period = 'custom'"
    >
      Période personnalisée
    </button>
    <el-date-picker
      v-if="period === 'custom'"
      v-model="customRange"
      type="daterange"
      start-placeholder="Début"
      end-placeholder="Fin"
      size="default"
      style="margin-left: 8px"
      @change="onCustomRangeChange"
    />
  </div>

  <el-skeleton v-if="loading" :rows="8" animated />

  <template v-else-if="report">
    <!-- Résumé -->
    <div class="stats-grid">
      <div class="card stat-card">
        <span class="stat-label">Chiffre d'affaires</span>
        <span class="stat-value">{{ report.summary.totalRevenue.toFixed(2) }} €</span>
      </div>
      <div class="card stat-card">
        <span class="stat-label">Commandes</span>
        <span class="stat-value">{{ report.summary.orderCount }}</span>
      </div>
      <div class="card stat-card">
        <span class="stat-label">Panier moyen</span>
        <span class="stat-value">{{ report.summary.averageOrderValue.toFixed(2) }} €</span>
      </div>
    </div>

    <!-- Graphique -->
    <div class="card chart-card">
      <h2>Évolution du chiffre d'affaires</h2>
      <RevenueChart :points="report.revenueOverTime" />
    </div>

    <div class="cards-row">
      <!-- Top produits -->
      <div class="card card--half">
        <h2>Produits les plus vendus</h2>
        <div v-if="report.topProducts.length === 0" class="no-data">
          Aucune vente sur cette période.
        </div>
        <div v-else class="top-products-list">
          <div v-for="(product, i) in report.topProducts" :key="product.productName" class="top-product-row">
            <span class="top-product-rank">{{ i + 1 }}</span>
            <span class="top-product-name">{{ product.productName }}</span>
            <span class="top-product-qty">{{ product.quantitySold }} vendu(s)</span>
            <strong class="top-product-revenue">{{ product.revenue.toFixed(2) }} €</strong>
          </div>
        </div>
      </div>

      <!-- Liste des commandes -->
      <div class="card card--half">
        <h2>Commandes ({{ report.orders.length }})</h2>
        <div v-if="report.orders.length === 0" class="no-data">
          Aucune commande sur cette période.
        </div>
        <el-table v-else :data="report.orders" style="width: 100%" max-height="360">
          <el-table-column label="Client" min-width="140">
            <template #default="{ row }">
              {{ row.client.firstname }} {{ row.client.lastname }}
            </template>
          </el-table-column>
          <el-table-column label="Articles" min-width="160">
            <template #default="{ row }">
              {{ row.orderItems.map((i: any) => `${i.quantity}× ${i.productClinic.product.name}`).join(', ') }}
            </template>
          </el-table-column>
          <el-table-column label="Statut" width="110">
            <template #default="{ row }">
              <el-tag size="small">{{ orderStatusLabel[row.status] ?? row.status }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="Date" width="100">
            <template #default="{ row }">
              {{ new Date(row.createdAt).toLocaleDateString('fr-FR') }}
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>
  </template>
</template>

<style scoped lang="scss">
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

.period-filters {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-lg);
}
.period-pill {
  padding: var(--spacing-xs) var(--spacing-md);
  border-radius: var(--radius-full);
  border: 1px solid var(--el-border-color);
  background: var(--el-bg-color);
  color: var(--el-text-color-regular);
  font-size: 13px;
  font-weight: var(--fw-medium);
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    border-color: var(--el-color-primary);
  }
}
.period-pill--active {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  font-weight: var(--fw-semibold);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-md);
}
.stat-card {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}
.stat-label {
  font-size: 12px;
  font-weight: var(--fw-semibold);
  color: var(--el-text-color-secondary);
  text-transform: uppercase;
}
.stat-value {
  font-size: 26px;
  font-weight: var(--fw-bold);
  color: var(--el-text-color-primary);
}

.chart-card {
  margin-bottom: var(--spacing-md);
}
.chart-card h2,
.card--half h2 {
  font-size: 15px;
  font-weight: var(--fw-semibold);
  color: var(--el-text-color-primary);
  margin: 0 0 var(--spacing-md);
}

.cards-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-md);
}

.no-data {
  color: var(--el-text-color-secondary);
  font-size: 14px;
  text-align: center;
  padding: var(--spacing-md) 0;
}

.top-products-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}
.top-product-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-xs) 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.top-product-row:last-child {
  border-bottom: none;
}
.top-product-rank {
  width: 20px;
  font-size: 12px;
  font-weight: var(--fw-bold);
  color: var(--el-text-color-placeholder);
}
.top-product-name {
  flex: 1;
  font-size: 14px;
}
.top-product-qty {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.top-product-revenue {
  min-width: 70px;
  text-align: right;
  color: var(--el-color-primary);
}

@media (max-width: 900px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
  .cards-row {
    grid-template-columns: 1fr;
  }
}
</style>