<script setup lang="ts">
import FormError from '@/components/ui/FormError.vue'
import Navbar from '@/components/ui/nav/NavbarComponent.vue'
import type { NavNode } from '@/components/ui/nav/NaveNode'
import { useAuthStore } from '@/stores/authStore'
import { clinicIdSchema } from '@armali/schemas'
import {
  House,
  User,
  UserFilled,
  OfficeBuilding,
  Calendar,
  ChatDotRound,
  ShoppingCart,
  TrendCharts,
  Wallet,
  Box,
  List,
  Shop,
  Setting,
  Tickets,
  Collection,
  Star,
  DataAnalysis,
} from '@element-plus/icons-vue'

const { user } = useAuthStore()
if (user?.role !== 'DIRECTOR') throw new Error()
const clinicId = clinicIdSchema.parse(user?.clinicId)

const menuItems: NavNode[] = [
  {
    index: 'DIRECTOR.Home',
    label: 'Accueil',
    icon: House,
  },
  {
    index: 'DIRECTOR.Calendar',
    label: 'Agenda',
    icon: Calendar,
  },
  {
    index: 'DIRECTOR.Clinic',
    label: 'Clinique',
    icon: OfficeBuilding,
    children: [
      {
        index: 'DIRECTOR.Clinic',
        label: 'Général',
        icon: Setting,
      },
      {
        index: 'DIRECTOR.Staff',
        label: 'Personnel',
        icon: UserFilled,
      },
      {
        index: 'DIRECTOR.Acts',
        label: 'Actes',
        icon: Tickets,
        params: { id: clinicId },
      },
      {
        index: 'DIRECTOR.Pets',
        label: 'Animaux',
        icon: Collection,
        params: { id: clinicId },
      },
      {
        index: 'DIRECTOR.Specialities',
        label: 'Spécialités',
        icon: Star,
        params: { id: clinicId },
      },
    ],
  },
  {
    index: 'DIRECTOR.Analytics',
    label: 'Statistiques',
    icon: DataAnalysis,
  },
  {
    index: 'DIRECTOR.Commerce',
    label: 'Commerce',
    icon: Shop,
    children: [
      {
        index: 'DIRECTOR.Boutique',
        label: 'Boutique',
        icon: ShoppingCart,
      },
      {
        index: 'DIRECTOR.Sales',
        label: 'Ventes',
        icon: TrendCharts,
      },
      {
        index: 'DIRECTOR.Budget',
        label: 'Budget',
        icon: Wallet,
      },
      {
        index: 'DIRECTOR.Suppliers',
        label: 'Fournisseurs',
        icon: Box,
      },
      {
        index: 'DIRECTOR.SupplierOrders',
        label: 'Commandes Fournisseurs',
        icon: List,
      },
    ],
  },
  {
    index: 'DIRECTOR.Messagerie',
    label: 'Messagerie',
    icon: ChatDotRound,
  },
  {
    index: 'DIRECTOR.Profil',
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
