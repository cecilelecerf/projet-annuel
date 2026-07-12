<script setup lang="ts">
import Navbar from '@/components/ui/nav/NavbarComponent.vue'

import {
  Box,
  DocumentChecked,
  House,
  List,
  OfficeBuilding,
  Setting,
  Star,
  User,
  Van,
} from '@element-plus/icons-vue'
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
    index: 'Admin.Specialities',
    label: 'Spécialités',
    icon: Star,
  },
  {
    index: '',
    label: 'Produits',
    icon: Box,
    children: [
      {
        index: 'ADMIN.Products',
        label: 'Catalogue produits',
        icon: Box,
      },
      {
        index: 'ADMIN.ProductRequests',
        label: 'Demandes de produits',
        icon: DocumentChecked,
      },
      {
        index: 'ADMIN.Suppliers',
        label: 'Fournisseurs',
        icon: Van,
      },
    ],
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
