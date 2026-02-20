<script setup lang="ts">
import { useAuthStore } from '@/stores/authStore'
import { storeToRefs } from 'pinia'

const authStore = useAuthStore()
const { user } = storeToRefs(authStore)
const handleLogin = async ({ email }: { email: string }) => {
  await authStore.login(email, 'password123')
  console.log('connecté:', user)
}
</script>

<template>
  <title>Connexion (dev section)</title>
  <div v-if="user">
    <p>Bonjour, {{ user.firstname }}</p>
    <button @click="authStore.logout()">Deconnexion</button>
  </div>
  <div v-else>
    <button @click="handleLogin({ email: 'client@email.com' })">Client</button>
    <button @click="handleLogin({ email: 'veterinarian@vetclinic.com' })">Vétérinaire</button>
    <button @click="handleLogin({ email: 'admin@vetclinic.com' })">Admin</button>
  </div>
</template>

<style scoped></style>
