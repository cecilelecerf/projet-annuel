<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useNotify } from '@/composables/useNotify'
import { dashboardApi } from '../../api/dashboard.api'
import type { ClientDashboard } from '@armali/schemas'
import { useAuthStore } from '@/stores/authStore'

const router = useRouter()
const notify = useNotify()

const dashboard = ref<ClientDashboard | null>(null)
const loading = ref(false)
const authStore = useAuthStore()

async function load() {
  loading.value = true
  try {
    const data = await dashboardApi.get()
    if (data.role !== 'CLIENT') return
    dashboard.value = data
  } catch (err: unknown) {
    notify.error(err instanceof Error ? err.message : 'Impossible de charger votre espace')
  } finally {
    loading.value = false
  }
}

onMounted(load)

function goToCreate() {
  router.push({ name: `${authStore.user?.role.toUpperCase()}.Animals.Create` })
}

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

const readyOrders = computed(() => dashboard.value?.ordersReadyForPickup ?? [])

const dayGreeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Bonjour'
  if (hour < 18) return 'Bon après-midi'
  return 'Bonsoir'
})

const nextMeeting = computed(() => dashboard.value?.upcomingMeetings?.[0] ?? null)
const otherMeetings = computed(() => dashboard.value?.upcomingMeetings?.slice(1) ?? [])

const speciesAccentVar: Record<string, string> = {
  Chien: '--el-color-warning',
  Chat: '--el-color-success',
}
function speciesAccent(species: string) {
  return `var(${speciesAccentVar[species] ?? '--el-color-info'})`
}

function ageFromBirth(iso: string) {
  const birth = new Date(iso)
  const diff = Date.now() - birth.getTime()
  const years = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25))
  if (years < 1) {
    const months = Math.floor(diff / (1000 * 60 * 60 * 24 * 30.44))
    return `${months} mois`
  }
  return `${years} an${years > 1 ? 's' : ''}`
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
function formatDay(iso: string) {
  return new Date(iso).getDate()
}
function formatMonth(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { month: 'short' }).replace('.', '')
}
function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}
function formatCurrency(value: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value)
}
</script>

<template>
  <div class="page-header">
    <div>
      <h1>Bonjour {{ authStore.user?.firstname }}</h1>
    </div>
  </div>

  <el-skeleton v-if="loading" :rows="6" animated />

  <template v-else-if="dashboard">
    <!-- Prochain rendez-vous : mis en avant -->
    <section
      class="hero-meeting"
      :class="{ 'hero-meeting--empty': !nextMeeting }"
      @click="nextMeeting && router.push({ name: 'CLIENT.Meetings' })"
    >
      <template v-if="nextMeeting">
        <div class="hero-meeting__date">
          <span class="hero-meeting__day">{{ formatDay(nextMeeting.date) }}</span>
          <span class="hero-meeting__month">{{ formatMonth(nextMeeting.date) }}</span>
        </div>
        <div class="hero-meeting__info">
          <span class="hero-meeting__label">Prochain rendez-vous</span>
          <h2 class="hero-meeting__title">{{ nextMeeting.animalName }}</h2>
          <p class="hero-meeting__meta">
            {{ formatTime(nextMeeting.date) }} ·
            {{ nextMeeting.veterinarianName ? `Dr. ${nextMeeting.veterinarianName}` : nextMeeting.clinicName ?? '—' }}
          </p>
        </div>
        <el-button class="hero-meeting__action" round @click.stop="router.push({ name: 'CLIENT.Meetings' })">
          Voir le détail
        </el-button>
      </template>
      <template v-else>
        <p class="hero-meeting__empty-text">Aucun rendez-vous prévu pour le moment</p>
        <el-button type="primary" round @click.stop="router.push({ name: 'CLIENT.Booking' })">
          Prendre rendez-vous
        </el-button>
      </template>
    </section>

    <!-- Mes animaux : vraies cartes, pas un compteur -->
    <section class="pets-section">
      <div class="section-header">
        <h2 class="section-title">Mes animaux</h2>
        <el-button text @click="router.push({ name: 'CLIENT.Animals' })">Tout voir</el-button>
      </div>
      <div class="pet-cards">
        <article
          v-for="animal in dashboard.animals"
          :key="animal.id"
          class="pet-card"
          :style="{ '--pet-accent': speciesAccent(animal.species) }"
          @click="router.push({ name: 'CLIENT.Animals' })"
        >
          <span class="pet-card__tab">{{ animal.species }}</span>
          <div class="pet-card__photo">
            <img v-if="animal.photoUrl" :src="animal.photoUrl" :alt="animal.name" />
            <span v-else class="pet-card__initial">{{ animal.name.charAt(0) }}</span>
          </div>
          <div class="pet-card__body">
            <h3 class="pet-card__name">{{ animal.name }}</h3>
            <p class="pet-card__breed">{{ animal.breed }} · {{ ageFromBirth(animal.dateOfBirth) }}</p>
          </div>
        </article>
        <button class="pet-card pet-card--add" @click="goToCreate" v-if="authStore.user?.role === 'CLIENT'">
          <el-icon :size="22"><Plus /></el-icon>
          <span>Ajouter un animal</span>
        </button>
      </div>
    </section>

    <div class="cards-row">
      <!-- Mes cliniques -->
      <div class="card card--half" v-if="dashboard.clinics.length">
        <h2>{{ dashboard.clinics.length > 1 ? 'Mes cliniques' : 'Ma clinique' }}</h2>
        <div class="clinic-list">
          <div v-for="clinic in dashboard.clinics" :key="clinic.id" class="clinic-item">
            <div class="clinic-item__image">
              <img v-if="clinic.image" :src="clinic.image" :alt="clinic.name" />
              <el-icon v-else :size="20"><OfficeBuilding /></el-icon>
            </div>
            <div class="clinic-item__info">
              <strong>{{ clinic.name }}</strong>
              <span class="clinic-item__address">{{ clinic.address }}</span>
            </div>
            <el-button text size="small" :href="`tel:${clinic.phone}`" tag="a">Appeler</el-button>
          </div>
        </div>
      </div>

      <!-- Autres rendez-vous -->
      <div class="card card--half" v-if="otherMeetings.length">
        <h2>Autres rendez-vous</h2>
        <div class="meeting-list">
          <div
            v-for="(meeting, i) in otherMeetings"
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
    </div>

    <!-- Produits disponibles dans mes cliniques -->
    <section class="products-section" v-if="dashboard.products.length">
      <div class="section-header">
        <h2 class="section-title">Disponible dans votre boutique</h2>
        <el-button text @click="router.push({ name: 'CLIENT.Shop' })">Voir la boutique</el-button>
      </div>
      <div class="product-cards">
        <article
          v-for="product in dashboard.products"
          :key="product.id"
          class="product-card"
          @click="router.push({ name: 'CLIENT.Shop' })"
        >
          <div class="product-card__image">
            <img v-if="product.picture" :src="product.picture" :alt="product.name" />
            <el-icon v-else :size="20"><Goods /></el-icon>
          </div>
          <span class="product-card__name">{{ product.name }}</span>
          <span class="product-card__price">{{ formatCurrency(product.price) }}</span>
        </article>
      </div>
    </section>

    <!-- Commandes prêtes à récupérer -->
    <section v-if="readyOrders.length" class="ready-orders">
      <div class="ready-orders__icon">
        <el-icon :size="20"><CircleCheck /></el-icon>
      </div>
      <div class="ready-orders__content">
        <p class="ready-orders__title">
          {{ readyOrders.length }} commande{{ readyOrders.length > 1 ? 's' : '' }} prête{{ readyOrders.length > 1 ? 's' : '' }} à récupérer
        </p>
        <p class="ready-orders__detail">
          {{ readyOrders.map((o) => o.items).join(' · ') }}
        </p>
      </div>
      <el-button round @click="router.push({ name: 'CLIENT.Orders' })">Voir</el-button>
    </section>

    <!-- Commandes récentes : discret, en bas -->
    <!-- <section class="card orders-card" v-if="dashboard.recentOrders.length">
      <h2>Commandes récentes</h2>
      <div class="order-list">
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
    </section> -->

  </template>
</template>

<style scoped>
.page-header {
  margin-bottom: var(--spacing-md);
}
.page-header__eyebrow {
  font-size: 12px;
  font-weight: var(--fw-semibold);
  color: var(--el-color-primary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin: 0 0 var(--spacing-2xs);
}
.page-header h1 {
  font-size: 26px;
  font-weight: var(--fw-bold);
  color: var(--el-text-color-primary);
  margin: 0 0 var(--spacing-xs);
}
.page-header__subtitle {
  color: var(--el-text-color-secondary);
  margin: 0;
  font-size: 14px;
}

/* Hero rendez-vous */
.hero-meeting {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  background: var(--el-fill-color-light);
  border-radius: 16px;
  padding: var(--spacing-md) var(--spacing-lg);
  margin-bottom: var(--spacing-lg);
  cursor: pointer;
  transition: background-color 0.15s ease;
}
.hero-meeting:hover {
  background: var(--el-fill-color);
}
.hero-meeting--empty {
  justify-content: space-between;
  cursor: default;
}
.hero-meeting__date {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: var(--el-bg-color);
  border-radius: 12px;
  padding: var(--spacing-xs) var(--spacing-sm);
  min-width: 56px;
  flex-shrink: 0;
}
.hero-meeting__day {
  font-size: 22px;
  font-weight: var(--fw-bold);
  line-height: 1;
  color: var(--el-text-color-primary);
}
.hero-meeting__month {
  font-size: 11px;
  text-transform: uppercase;
  color: var(--el-text-color-secondary);
}
.hero-meeting__info {
  flex: 1;
  min-width: 0;
}
.hero-meeting__label {
  display: block;
  font-size: 11px;
  font-weight: var(--fw-semibold);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--el-color-primary);
  margin-bottom: var(--spacing-2xs);
}
.hero-meeting__title {
  font-size: 17px;
  font-weight: var(--fw-semibold);
  color: var(--el-text-color-primary);
  margin: 0 0 var(--spacing-2xs);
}
.hero-meeting__meta {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  margin: 0;
}
.hero-meeting__empty-text {
  color: var(--el-text-color-secondary);
  font-size: 14px;
  margin: 0;
}

/* Sections génériques */
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-md);
}
.section-title {
  font-size: 15px;
  font-weight: var(--fw-semibold);
  color: var(--el-text-color-primary);
  margin: 0;
}

/* Mes animaux — carnet de santé */
.pets-section {
  margin-bottom: var(--spacing-lg);
}
.pet-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: var(--spacing-sm);
}
.pet-card {
  position: relative;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 14px;
  padding: var(--spacing-md) var(--spacing-sm) var(--spacing-sm);
  overflow: hidden;
  cursor: pointer;
  transition: border-color 0.15s ease, transform 0.15s ease;
}
.pet-card:hover {
  border-color: var(--el-color-primary);
  transform: translateY(-2px);
}
.pet-card__tab {
  position: absolute;
  top: 0;
  right: 0;
  background: var(--pet-accent, var(--el-color-info));
  color: var(--el-color-white);
  font-size: 10px;
  font-weight: var(--fw-semibold);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 3px 10px;
  border-radius: 0 0 0 10px;
}
.pet-card__photo {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  overflow: hidden;
  background: var(--el-fill-color-light);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: var(--spacing-sm);
  font-weight: var(--fw-bold);
  color: var(--el-text-color-secondary);
}
.pet-card__photo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.pet-card__name {
  margin: 0 0 2px;
  font-size: 14px;
  font-weight: var(--fw-semibold);
  color: var(--el-text-color-primary);
}
.pet-card__breed {
  margin: 0;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.pet-card--add {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-xs);
  border: 1px dashed var(--el-border-color);
  background: transparent;
  color: var(--el-text-color-secondary);
  cursor: pointer;
  min-height: 130px;
  font-size: 13px;
}

.cards-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}
.card h2 {
  font-size: 15px;
  font-weight: var(--fw-semibold);
  color: var(--el-text-color-primary);
  margin: 0 0 var(--spacing-md);
}

/* Cliniques */
.clinic-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}
.clinic-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding-bottom: var(--spacing-sm);
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.clinic-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}
.clinic-item__image {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  overflow: hidden;
  background: var(--el-fill-color-light);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: var(--el-text-color-secondary);
}
.clinic-item__image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.clinic-item__info {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
}
.clinic-item__address {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

/* Rendez-vous */
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

/* Produits */
.products-section {
  margin-bottom: var(--spacing-lg);
}
.product-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  gap: var(--spacing-sm);
}
.product-card {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2xs);
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
  padding: var(--spacing-sm);
  cursor: pointer;
  transition: border-color 0.15s ease;
}
.product-card:hover {
  border-color: var(--el-color-primary);
}
.product-card__image {
  width: 100%;
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
  background: var(--el-fill-color-light);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--el-text-color-secondary);
  margin-bottom: var(--spacing-2xs);
}
.product-card__image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.product-card__name {
  font-size: 13px;
  font-weight: var(--fw-semibold);
  color: var(--el-text-color-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.product-card__price {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

/* Commandes */
.orders-card {
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
  padding: var(--spacing-md);
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
  .cards-row {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 480px) {
  .hero-meeting {
    flex-wrap: wrap;
  }
}
</style>