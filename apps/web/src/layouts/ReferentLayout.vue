<script setup lang="ts">
import Navbar from '@/components/ui/nav/NavbarComponent.vue'
import type { MenuItem } from '@/components/ui/nav/SidebarComponent.vue'
import { House, UserFilled, OfficeBuilding, User, ChatDotRound } from '@element-plus/icons-vue'

const menuItems: MenuItem[] = [
  {
    index: 'REFERANT.Home',
    label: 'Accueil',
    icon: House,
  },
  {
    index: 'REFERANT.Staff',
    label: 'Personnel',
    icon: UserFilled,
  },
  {
    index: 'REFERANT.Clinic',
    label: 'Clinique',
    icon: OfficeBuilding,
  },
  {
    index: 'REFERANT.Messagerie',
    label: 'Messagerie',
    icon: ChatDotRound,
  },
  {
    index: 'REFERANT.Profil',
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
