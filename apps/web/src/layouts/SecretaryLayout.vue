<script setup lang="ts">
import FormError from '@/components/ui/FormError.vue'
import Navbar from '@/components/ui/nav/Navbar.vue'
import type { MenuItem } from '@/components/ui/nav/Sidebar.vue'
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
  <FormError />
  <main>
    <Navbar :menu-items="menuItems" />
    <router-view />
  </main>
</template>
