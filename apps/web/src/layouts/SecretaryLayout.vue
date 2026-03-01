<script setup lang="ts">
import Navbar from '@/components/nav/Navbar.vue'
import type { MenuItem } from '@/components/nav/Sidebar.vue'
import { Calendar, ChatDotRound, User } from '@element-plus/icons-vue'

const menuItems: MenuItem[] = [
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
  <main>
    <Navbar :menu-items="menuItems" />
    <router-view />
  </main>
</template>
