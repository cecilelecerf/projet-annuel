<script setup lang="ts">
import FormError from '@/components/ui/FormError.vue'
import Navbar from '@/components/ui/nav/Navbar.vue'
import type { MenuItem } from '@/components/ui/nav/Sidebar.vue'
import { House, Calendar, ChatDotRound, User } from '@element-plus/icons-vue'

const menuItems: MenuItem[] = [
  {
    index: 'Veto.Home',
    label: 'Accueil',
    icon: House,
  },
  {
    index: 'Veto.Calendar',
    label: 'Agenda',
    icon: Calendar,
  },
  {
    index: 'animaux',
    label: 'Animaux',
    icon: '🐻',
    children: [
      { index: 'Veto.Animaux.MesAnimaux', label: 'Mes animaux' },
      { index: 'Veto.Animaux.Derniers', label: 'Derniers traités' },
    ],
  },
  {
    index: 'Veto.Messagerie',
    label: 'Messagerie',
    icon: ChatDotRound,
  },
  {
    index: 'Veto.Profil',
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
