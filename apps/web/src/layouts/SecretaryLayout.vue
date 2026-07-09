<script setup lang="ts">
import FormError from '@/components/ui/FormError.vue'
import Navbar from '@/components/ui/nav/NavbarComponent.vue'
import type { NavNode } from '@/components/ui/nav/NaveNode'
import { House, Calendar, ChatDotRound, User, SetUp, Box } from '@element-plus/icons-vue'

const menuItems: NavNode[] = [
  {
    index: 'SECRETARY.Home',
    label: 'Accueil',
    icon: House,
  },
  {
    index: 'SECRETARY.Calendar',
    label: 'Agenda',
    icon: Calendar,
  },
  {
    index: 'SECRETARY.Veto.List',
    label: 'Vétérinaire',
    icon: Calendar,
  },
  {
    index: 'SECRETARY.Messagerie',
    label: 'Messagerie',
    icon: ChatDotRound,
  },
  {
    index: 'SECRETARY.Avaibality',
    label: 'Disponibilité',
    icon: SetUp,
  },
  {
    index: 'SECRETARY.Orders',
    label: 'Retrait commandes',
    icon: Box,
  },
  {
    index: 'SECRETARY.Profil',
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
