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

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

function initials(firstname: string, lastname: string) {
  return `${firstname[0] ?? ''}${lastname[0] ?? ''}`.toUpperCase()
}
</script>

<template>
  <div class="page-header">
    <h1>Tableau de bord</h1>
    <p>Vue du jour pour votre clinique</p>
  </div>

  <el-skeleton v-if="loading" :rows="6" animated />

  <template v-else-if="dashboard">
    <!-- Raccourcis rapides -->
    <div class="quick-links">
      <el-button @click="router.push({ name: 'SECRETARY.Orders' })">Commandes</el-button>
      <el-button @click="router.push({ name: 'SECRETARY.Calendar' })">Agenda</el-button>
      <el-button @click="router.push({ name: 'SECRETARY.Veto.List' })">Personnel</el-button>
      <el-button @click="router.push({ name: 'SECRETARY.Messagerie' })">Messagerie</el-button>
    </div>

    <!-- ── Priorité 1 : la journée (RDV + présence) ─────────────────────── -->
    <div class="today-section">
      <div class="card today-meetings">
        <div class="card-header">
          <h2>Rendez-vous du jour</h2>
          <el-tag>{{ dashboard.todaysMeetingsCount }}</el-tag>
        </div>
        <div v-if="dashboard.todaysMeetings.length === 0" class="no-data">
          Aucun rendez-vous aujourd'hui.
        </div>
        <div v-else class="meeting-list">
          <div
            v-for="(meeting, i) in dashboard.todaysMeetings"
            :key="i"
            class="meeting-item"
            @click="router.push({ name: 'SECRETARY.Calendar' })"
          >
            <span class="meeting-time">{{ formatTime(meeting.startTime) }}</span>
            <div class="meeting-info">
              <strong>{{ meeting.animalName }}</strong>
              <span class="meeting-vet">{{ meeting.veterinarianName }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="card today-vets">
        <div class="card-header">
          <h2>Vétérinaires présents</h2>
          <el-tag type="success">{{ dashboard.presentVeterinarians.length }}</el-tag>
        </div>
        <div v-if="dashboard.presentVeterinarians.length === 0" class="no-data">
          Aucun vétérinaire présent aujourd'hui.
        </div>
        <div v-else class="vet-list">
          <div
            v-for="vet in dashboard.presentVeterinarians"
            :key="vet.id"
            class="vet-item"
            @click="router.push({ name: 'SECRETARY.Veto.Calendar', params: { id: vet.id } })"
          >
            <el-avatar :size="32">{{ initials(vet.firstname, vet.lastname) }}</el-avatar>
            <span>{{ vet.firstname }} {{ vet.lastname }}</span>
          </div>
        </div>
        <el-button text class="staff-link" @click="router.push({ name: 'SECRETARY.Veto.List' })">
          Voir tout le personnel ({{ dashboard.staff.veterinarianCount }} véto ) →
        </el-button>
      </div>
    </div>

    <!-- ── Priorité 2 : les commandes ────────────────────────────────────── -->
    <div class="orders-section">
      <div class="card orders-card">
        <div class="card-header">
          <h2>À préparer</h2>
          <el-tag :type="dashboard.ordersToPrepareCount > 0 ? 'warning' : 'info'">
            {{ dashboard.ordersToPrepareCount }}
          </el-tag>
        </div>
        <div v-if="dashboard.ordersToPrepare.length === 0" class="no-data">
          Aucune commande à préparer.
        </div>
        <div v-else class="order-list">
          <div
            v-for="order in dashboard.ordersToPrepare"
            :key="order.id"
            class="order-item"
            @click="router.push({ name: 'SECRETARY.Orders' })"
          >
            <strong>{{ order.clientName }}</strong>
            <span class="order-items">{{ order.items }}</span>
            <span class="order-total">{{ order.total.toFixed(2) }} €</span>
          </div>
        </div>
      </div>

      <div class="card orders-card">
        <div class="card-header">
          <h2>Prêtes à récupérer</h2>
          <el-tag type="success">{{ dashboard.ordersReadyForPickupCount }}</el-tag>
        </div>
        <div v-if="dashboard.ordersReadyForPickup.length === 0" class="no-data">
          Aucune commande en attente de retrait.
        </div>
        <div v-else class="order-list">
          <div
            v-for="order in dashboard.ordersReadyForPickup"
            :key="order.id"
            class="order-item"
            @click="router.push({ name: 'SECRETARY.Orders' })"
          >
            <strong>{{ order.clientName }}</strong>
            <span class="order-items">{{ order.items }}</span>
            <span class="order-total">{{ order.total.toFixed(2) }} €</span>
          </div>
        </div>
      </div>
    </div>
  </template>
</template>

<style scoped>
.page-header {
  margin-bottom: var(--spacing-md);
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

.quick-links {
  display: flex;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-lg);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-md);
}
.card-header h2 {
  font-size: 15px;
  font-weight: var(--fw-semibold);
  color: var(--el-text-color-primary);
  margin: 0;
}

.no-data {
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

/* ── Section du jour (priorité 1) ─────────────────────────────────────── */
.today-section {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}
.today-meetings,
.today-vets {
  min-height: 260px;
}

.meeting-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  max-height: 380px;
  overflow-y: auto;
}
.meeting-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding-bottom: var(--spacing-sm);
  border-bottom: 1px solid var(--el-border-color-lighter);
  cursor: pointer;
}
.meeting-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}
.meeting-time {
  font-size: 14px;
  font-weight: var(--fw-bold);
  color: var(--el-color-primary);
  white-space: nowrap;
  min-width: 48px;
}
.meeting-info {
  display: flex;
  flex-direction: column;
}
.meeting-vet {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.vet-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
}
.vet-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  cursor: pointer;
  padding: var(--spacing-xs);
  border-radius: var(--radius-sm);
  transition: background 0.15s ease;
}
.vet-item:hover {
  background: var(--el-fill-color-light);
}
.staff-link {
  font-size: 12px;
}

/* ── Section commandes (priorité 2) ───────────────────────────────────── */
.orders-section {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-md);
}
.order-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  max-height: 240px;
  overflow-y: auto;
}
.order-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding-bottom: var(--spacing-sm);
  border-bottom: 1px solid var(--el-border-color-lighter);
  cursor: pointer;
}
.order-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}
.order-items {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.order-total {
  font-size: 13px;
  font-weight: var(--fw-semibold);
  color: var(--el-color-primary);
}

@media (max-width: 900px) {
  .today-section,
  .orders-section {
    grid-template-columns: 1fr;
  }
}
</style>