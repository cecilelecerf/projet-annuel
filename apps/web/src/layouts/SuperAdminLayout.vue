<script setup lang="ts">
import Navbar from '@/components/ui/nav/NavbarComponent.vue'
import { House, List, OfficeBuilding, Setting, User } from '@element-plus/icons-vue'
import FormError from '@/components/ui/FormError.vue'
import type { NavNode } from '@/components/ui/nav/NaveNode'

const menuItems: NavNode[] = [
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
    index: 'ADMIN.Settings',
    label: 'Settings',
    icon: Setting,
    children: [
      {
        index: 'ADMIN.Acts',
        label: 'Acts',
      },
      {
        index: 'ADMIN.Vaccines',
        label: 'Vaccine',
      },
      {
        index: 'ADMIN.Pets',
        label: 'Pets',
      },
    ],
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
