<script setup lang="ts">
import FormError from '@/components/ui/FormError.vue'
import Navbar from '@/components/ui/nav/Navbar.vue'
import type { MenuItem } from '@/components/ui/nav/Sidebar.vue'
import { House, Calendar, ChatDotRound, User } from '@element-plus/icons-vue'

const menuItems: MenuItem[] = [
  {
    index: 'Secretary.Home',
    label: 'Accueil',
    icon: House,
  },
  {
    index: 'Secretary.Calendar',
    label: 'Agenda',
    icon: Calendar,
  },
  {
    index: 'Secretary.Veto.List',
    label: 'Vétérinaire',
    icon: Calendar,
  },
  {
    index: 'Secretary.Messagerie',
    label: 'Messagerie',
    icon: ChatDotRound,
  },
  {
    index: 'Secretary.Profil',
    label: 'Profil',
    icon: User,
  },
]
</script>

<template>
  <div class="layout">
    <FormError />
    <Navbar :menu-items="menuItems" />
    <Suspense>
      <main class="main">
        <router-view />
      </main>

      <template #fallback>
        <div class="loading">Chargement...</div>
      </template>
    </Suspense>
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
