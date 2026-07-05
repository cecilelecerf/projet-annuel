<script setup lang="ts">
import Navbar from '@/components/ui/nav/Navbar.vue'
import type { MenuItem } from '@/components/ui/nav/Sidebar.vue'
import {
  House,
  UserFilled,
  OfficeBuilding,
  User,
  ChatDotRound,
  TrendCharts,
} from '@element-plus/icons-vue'

const menuItems: MenuItem[] = [
  {
    index: 'Referent.Home',
    label: 'Accueil',
    icon: House,
  },
  {
    index: 'Referent.Staff',
    label: 'Personnel',
    icon: UserFilled,
  },
  {
    index: 'Referent.Clinic',
    label: 'Clinique',
    icon: OfficeBuilding,
  },
  {
    index: 'Referent.VisitsForecast',
    label: 'Prévisions',
    icon: TrendCharts,
  },
  {
    index: 'Referent.Messagerie',
    label: 'Messagerie',
    icon: ChatDotRound,
  },
  {
    index: 'Referent.Profil',
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
      <router-view />
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
