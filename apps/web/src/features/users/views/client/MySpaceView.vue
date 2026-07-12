<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useNotify } from '@/composables/useNotify'
import { dashboardApi } from '../../api/dashboard.api'
import type { ClientDashboard } from '@armali/schemas'

const router = useRouter()
const notify = useNotify()

const dashboard = ref<ClientDashboard | null>(null)
const loading = ref(false)

async function load() {
  loading.value = true
  try {
    const data = await dashboardApi.get()
    if (data.role !== 'CLIENT') return
    dashboard.value = data
  } catch (err: unknown) {
    notify.error(err instanceof Error ? err.message : 'Impossible de charger le tableau de bord')
  } finally {
    loading.value = false
  }
}

onMounted(load)

const statusLabel: Record<ClientDashboard['recentOrders'][number]['status'], string> = {
  PENDING: 'En attente de paiement',
  CONFIRMED: 'Confirmée',
  READY: 'Prête à récupérer',
  PICKED_UP: 'Récupérée',
  CANCELLED: 'Annulée',
}
const statusTag: Record<ClientDashboard['recentOrders'][number]['status'], string> = {
  PENDING: 'warning',
  CONFIRMED: 'primary',
  READY: 'success',
  PICKED_UP: 'info',
  CANCELLED: 'danger',
}

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

function formatCurrency(value: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value)
}
</script>

<template>
  <div class="page-header">
    <h1>Tableau de bord</h1>
    <p>Vos animaux, vos rendez-vous et vos commandes</p>
  </div>

  <el-skeleton v-if="loading" :rows="6" animated />

  <template v-else-if="dashboard">
    <div class="stats-grid">
      <div class="card stat-card" @click="router.push({ name: 'CLIENT.Animals' })">
        <span class="stat-label">Mes animaux</span>
        <span class="stat-value">{{ dashboard.animalsCount }}</span>
      </div>
      <div class="card stat-card" @click="router.push({ name: 'CLIENT.Meetings' })">
        <span class="stat-label">Rendez-vous à venir</span>
        <span class="stat-value">{{ dashboard.upcomingMeetingsCount }}</span>
      </div>
      <div class="card stat-card" @click="router.push({ name: 'CLIENT.Orders' })">
        <span class="stat-label">Commandes en cours</span>
        <span class="stat-value">{{ dashboard.ordersInProgressCount }}</span>
      </div>
    </div>

    <div class="quick-links">
      <el-button type="primary" @click="router.push({ name: 'CLIENT.Booking' })">
        Prendre rendez-vous
      </el-button>
      <el-button @click="router.push({ name: 'CLIENT.Shop' })">Voir la boutique</el-button>
    </div>

    <div class="cards-row">
      <div class="card card--half">
        <h2>Prochains rendez-vous</h2>
        <div v-if="dashboard.upcomingMeetings.length === 0" class="no-data">
          Aucun rendez-vous à venir.
        </div>
        <div v-else class="meeting-list">
          <div
            v-for="(meeting, i) in dashboard.upcomingMeetings"
            :key="i"
            class="meeting-item"
            @click="router.push({ name: 'CLIENT.Meetings' })"
          >
            <div class="meeting-time">{{ formatDateTime(meeting.date) }}</div>
            <div class="meeting-info">
              <strong>{{ meeting.animalName }}</strong>
              <span class="meeting-client">
                {{ meeting.veterinarianName ? `Dr. ${meeting.veterinarianName}` : meeting.clinicName ?? '—' }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div class="card card--half">
        <h2>Commandes récentes</h2>
        <div v-if="dashboard.recentOrders.length === 0" class="no-data">
          Aucune commande pour le moment.
        </div>
        <div v-else class="order-list">
          <div
            v-for="order in dashboard.recentOrders"
            :key="order.id"
            class="order-item"
            @click="router.push({ name: 'CLIENT.Orders' })"
          >
            <div class="order-info">
              <span class="order-items">{{ order.items }}</span>
              <span class="order-date">{{ formatDate(order.createdAt) }}</span>
            </div>
            <div class="order-side">
              <span class="order-total">{{ formatCurrency(order.total) }}</span>
              <el-tag :type="statusTag[order.status] as any" size="small">
                {{ statusLabel[order.status] }}
              </el-tag>
            </div>
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
  grid-template-columns: repeat(3, 1fr);
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

.order-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}
.order-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--spacing-sm);
  padding-bottom: var(--spacing-sm);
  border-bottom: 1px solid var(--el-border-color-lighter);
  cursor: pointer;
}
.order-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}
.order-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.order-items {
  font-size: 13px;
  font-weight: var(--fw-semibold);
  color: var(--el-text-color-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.order-date {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.order-side {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: var(--spacing-2xs);
  flex-shrink: 0;
}
.order-total {
  font-size: 13px;
  font-weight: var(--fw-semibold);
  color: var(--el-text-color-primary);
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
