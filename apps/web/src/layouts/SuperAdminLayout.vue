<script setup lang="ts">
import Navbar from '@/components/ui/nav/NavbarComponent.vue'
import type { MenuItem } from '@/components/ui/nav/SidebarComponent.vue'
import { House, List, OfficeBuilding, User } from '@element-plus/icons-vue'
import FormError from '@/components/ui/FormError.vue'

const menuItems: MenuItem[] = [
  {
    index: 'ADMIN.Home',
    label: 'Accueil',
    icon: House,
  },
  {
    index: 'ADMIN.ClinicRequests',
    label: 'Demandes cliniques',
    icon: List,
  },
  {
    index: 'ADMIN.Clinics',
    label: 'Cliniques',
    icon: OfficeBuilding,
  },
  {
    index: 'ADMIN.Acts',
    label: 'Acts',
    icon: OfficeBuilding,
  },
  {
    index: 'ADMIN.Profil',
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
