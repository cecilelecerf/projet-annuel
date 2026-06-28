<script setup lang="ts">
import Navbar from '@/components/ui/nav/Navbar.vue'
import type { MenuItem } from '@/components/ui/nav/Sidebar.vue'
import { House, User, Star } from '@element-plus/icons-vue'
import FormError from '@/components/ui/FormError.vue'

const menuItems: MenuItem[] = [
  {
    index: 'Client.Home',
    label: 'Accueil',
    icon: House,
  },
  {
    index: 'Client.Reviews',
    label: 'Vétérinaires',
    icon: Star,
  },
  {
    index: 'Client.Profil',
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
      <router-view />
    </main>
  </div>
</template>

<style scoped>
.layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}
.main {
  flex: 1;
  background: #f8f9fa;
}
</style>
