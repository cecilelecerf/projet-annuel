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
  <FormError />
  <main>
    <Navbar :menu-items="menuItems" />
    <Suspense>
      <div class="content">
        <router-view />
      </div>

      <template #fallback>
        <div class="loading">Chargement...</div>
      </template>
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
