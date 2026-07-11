<script setup lang="ts">
import FormError from '@/components/ui/FormError.vue'
import Navbar from '@/components/ui/nav/NavbarComponent.vue'
import type { MenuItem } from '@/components/ui/nav/SidebarComponent.vue'
import { House, Calendar, User, SetUp } from '@element-plus/icons-vue'

const menuItems: MenuItem[] = [
  {
    index: 'VETERINARIAN.Home',
    label: 'Accueil',
    icon: House,
  },
  {
    index: 'VETERINARIAN.Calendar',
    label: 'Agenda',
    icon: Calendar,
  },
  {
    index: 'VETERINARIAN.Availability',
    label: 'Disponibilité',
    icon: SetUp,
  },
  {
    index: 'VETERINARIAN.Profil',
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
      </Suspense>
    </main>
  </div>
</template>

<style scoped></style>
