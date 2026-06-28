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
  <FormError />
  <main>
    <Navbar :menu-items="menuItems" />
    <Suspense>
      <div class="content">
        <router-view />
      </div>
    </Suspense>
  </main>
</template>

<style lang="scss" scoped>
.content {
  margin-inline: var(--spacing-md);
  margin-top: var(--spacing-lg);
  @include above('sm') {
    margin-inline: var(--spacing-lg);
  }
  @include above('md') {
    margin-inline: var(--spacing-xl);
    margin-top: var(--spacing-xl);
  }
  @include above('lg') {
    margin-inline: var(--spacing-3xl);
  }
}
</style>
