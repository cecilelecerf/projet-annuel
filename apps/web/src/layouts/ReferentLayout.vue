<script setup lang="ts">
import Navbar from '@/components/ui/nav/NavbarComponent.vue'
import type { NavNode } from '@/components/ui/nav/NaveNode'
import { useAuthStore } from '@/stores/authStore'
import {
  House,
  UserFilled,
  OfficeBuilding,
  User,
  ChatDotRound,
  ShoppingCart,
  TrendCharts,
  Wallet,
  Box,
  List,
  Setting,
  Tickets,
  Collection,
  Star,
  Shop,
} from '@element-plus/icons-vue'
const { user } = useAuthStore()

if (user?.role !== 'REFERENT') throw new Error()

const menuItems: NavNode[] = [
  {
    index: 'REFERENT.Home',
    label: 'Accueil',
    icon: House,
  },
  {
    index: 'REFERENT.Clinic',
    label: 'Clinique',
    icon: OfficeBuilding,
    children: [
      {
        index: 'REFERENT.Clinic',
        label: 'Général',
        icon: Setting,
      },
      {
        index: 'REFERENT.Staff',
        label: 'Personnel',
        icon: UserFilled,
      },
      {
        index: 'REFERENT.Acts',
        label: 'Actes',
        icon: Tickets,
        params: { id: user.clinicId },
      },
      {
        index: 'REFERENT.Pets',
        label: 'Animaux',
        icon: Collection,
        params: { id: user.clinicId },
      },
      {
        index: 'REFERENT.Specialities',
        label: 'Spécialités',
        icon: Star,
        params: { id: user.clinicId },
      },
    ],
  },
  {
    index: 'REFERENT.VisitsForecast',
    label: 'Prévisions',
    icon: TrendCharts,
  },
  {
    index: 'DIRECTOR.Commerce',
    label: 'Commerce',
    icon: Shop,
    children: [
      {
        index: 'REFERENT.Boutique',
        label: 'Boutique',
        icon: ShoppingCart,
      },
      {
        index: 'REFERENT.Sales',
        label: 'Ventes',
        icon: TrendCharts,
      },
      {
        index: 'REFERENT.Budget',
        label: 'Budget',
        icon: Wallet,
      },
      {
        index: 'REFERENT.Suppliers',
        label: 'Fournisseurs',
        icon: Box,
      },
      {
        index: 'REFERENT.SupplierOrders',
        label: 'Commandes Fournisseurs',
        icon: List,
      },
    ],
  },
  {
    index: 'REFERENT.Messagerie',
    label: 'Messagerie',
    icon: ChatDotRound,
  },
  {
    index: 'REFERENT.Profil',
    label: 'Profil',
    icon: User,
  },
]
</script>

<template>
  <div class="layout">
    <FormError />

    <Navbar :menu-items="menuItems" />
    <main class="main">
      <Suspense>
        <router-view />
        <template #fallback>
          <div class="loading">Chargement...</div>
        </template>
      </Suspense>
    </main>
  </div>
</template>

<style scoped>
.layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: #f8f9fa;
}
.main {
  width: 100%;
  max-width: 1200px;
  margin-inline: auto;
  padding: 32px 24px;
}
</style>
