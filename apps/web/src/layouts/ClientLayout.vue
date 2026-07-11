<script setup lang="ts">
import Navbar from '@/components/ui/nav/NavbarComponent.vue'
import { House, User, Calendar, ShoppingCart, Box } from '@element-plus/icons-vue'
import FormError from '@/components/ui/FormError.vue'
import type { NavNode } from '@/components/ui/nav/NaveNode'

const menuItems: NavNode[] = [
  {
    index: 'CLIENT.Home',
    label: 'Accueil',
    icon: House,
  },
  {
    index: 'CLIENT.Animals',
    label: 'Mes animaux',
    icon: User,
  },
  {
    index: 'CLIENT.Meetings',
    label: 'Rendez-vous',
    icon: Calendar,
  },
  {
    index: 'CLIENT.Shop',
    label: 'Boutique',
    icon: ShoppingCart,
  },
  {
    index: 'CLIENT.Orders',
    label: 'Mes commandes',
    icon: Box,
  },
  {
    index: 'CLIENT.Profil',
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
