<script setup lang="ts">
import FormError from '@/components/ui/FormError.vue'
import Navbar from '@/components/ui/nav/Navbar.vue'
import type { MenuItem } from '@/components/ui/nav/Sidebar.vue'
import {
  House,
  User,
  UserFilled,
  OfficeBuilding,
  ChatDotRound,
  TrendCharts,
} from '@element-plus/icons-vue'

const menuItems: MenuItem[] = [
  {
    index: 'Director.Home',
    label: 'Accueil',
    icon: House,
  },
  {
    index: 'Director.Staff',
    label: 'Personnel',
    icon: UserFilled,
  },
  {
    index: 'Director.Clinic',
    label: 'Clinique',
    icon: OfficeBuilding,
  },
  {
    index: 'Director.Analytics',
    label: 'Statistiques',
    icon: TrendCharts,
  },
  {
    index: 'Director.Messagerie',
    label: 'Messagerie',
    icon: ChatDotRound,
  },
  {
    index: 'Director.Profil',
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
