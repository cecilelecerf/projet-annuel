<script setup lang="ts">
import FormError from '@/components/ui/FormError.vue'
import Navbar from '@/components/ui/nav/NavbarComponent.vue'
import type { MenuItem } from '@/components/ui/nav/SidebarComponent.vue'
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
} from '@element-plus/icons-vue'

const menuItems: MenuItem[] = [
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
    index: 'DIRECTOR.Staff',
    label: 'Personnel',
    icon: UserFilled,
  },
  {
    index: 'DIRECTOR.Clinic',
    label: 'Clinique',
    icon: OfficeBuilding,
  },
  {
    index: 'DIRECTOR.Messagerie',
    label: 'Messagerie',
    icon: ChatDotRound,
  },
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
