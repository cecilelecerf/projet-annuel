<script setup lang="ts">
import { useAuthStore } from '@/stores/authStore'

const authStore = useAuthStore()
</script>

<template>
  <div class="admin-home">
    <h1>Administration</h1>
    <p>Bienvenue, {{ authStore.user?.firstname }}. Vous êtes connecté en tant qu'administrateur.</p>
  </div>
</template>

<style scoped>
.admin-home {
  padding: 32px 24px;
}

.admin-home h1 {
  font-size: 24px;
  font-weight: 700;
  margin: 0 0 8px;
}

.admin-home p {
  color: #6b7280;
}
</style>
