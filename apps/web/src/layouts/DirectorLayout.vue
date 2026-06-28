<script setup lang="ts">
import FormError from '@/components/ui/FormError.vue'
import Navbar from '@/components/ui/nav/Navbar.vue'
import type { MenuItem } from '@/components/ui/nav/Sidebar.vue'
import { House, User, UserFilled, OfficeBuilding } from '@element-plus/icons-vue'

const menuItems: MenuItem[] = [
  {
    index: 'Director.Home',
    label: 'Accueil',
    icon: House,
  },
  {
    index: 'Director.Staff',
    label: 'Personnel',
    icon: UserFilled,
  },
  {
    index: 'Director.Clinic',
    label: 'Clinique',
    icon: OfficeBuilding,
  },
  {
    index: 'Director.Profil',
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
