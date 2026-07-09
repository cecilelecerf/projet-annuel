<script setup lang="ts">
import Navbar from '@/components/ui/nav/NavbarComponent.vue'
import type { NavNode } from '@/components/ui/nav/NaveNode'
import { useAuthStore } from '@/stores/authStore'
import { clinicIdSchema } from '@armali/schemas'
import {
  House,
  UserFilled,
  OfficeBuilding,
  User,
  ChatDotRound,
  ShoppingCart,
} from '@element-plus/icons-vue'
const { user } = useAuthStore()
const clinicId = clinicIdSchema.parse(user?.clinicId)

const menuItems: NavNode[] = [
  {
    index: 'REFERENT.Home',
    label: 'Accueil',
    icon: House,
  },
  {
    index: 'REFERENT.Clinic',
    label: 'Clinique',
    icon: OfficeBuilding,
    children: [
      {
        index: 'REFERENT.Clinic',
        label: 'Général',
      },
      {
        index: 'REFERENT.Staff',
        label: 'Personnel',
        icon: UserFilled,
      },
      {
        index: 'REFERENT.Acts',
        label: 'Acts',
        params: { id: clinicId },
      },
      {
        index: 'REFERENT.Pets',
        label: 'Pets',
        params: { id: clinicId },
      },
      {
        index: 'REFERENT.Specialities',
        label: 'Spécialités',
        params: { id: clinicId },
      },
    ],
  },
  {
    index: 'REFERENT.Boutique',
    label: 'Boutique',
    icon: ShoppingCart,
  },
  {
    index: 'REFERENT.Messagerie',
    label: 'Messagerie',
    icon: ChatDotRound,
  },
  {
    index: 'REFERENT.Profil',
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
