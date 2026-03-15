<script setup lang="ts">
import type { MenuItem } from '@/components/ui/nav/Sidebar.vue'
import { Calendar, ChatDotRound, Menu, User } from '@element-plus/icons-vue'

const menuItems: MenuItem[] = [
  {
    index: 'agenda',
    label: 'Agenda',
    icon: Calendar,
    children: [
      { index: 'Veto.Agenda.Journalier', label: 'Vue journalière' },
      { index: 'Veto.Agenda.Hebdomadaire', label: 'Vue hebdomadaire' },
      { index: 'Veto.Agenda.Mensuel', label: 'Vue mensuelle' },
    ],
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
  <main>
    <Navbar :menu-items="menuItems" />
    <router-view />
  </main>
</template>
