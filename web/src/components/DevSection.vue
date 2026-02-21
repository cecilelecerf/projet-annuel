<script setup lang="ts">
import { useAuthStore } from '@/stores/authStore'
import { storeToRefs } from 'pinia'

const authStore = useAuthStore()
const { user } = storeToRefs(authStore)
const handleLogin = async ({ email }: { email: string }) => {
  await authStore.login(email, 'Password123!')
  console.log('connecté:', user)
}
</script>

<template>
  <title>Connexion (dev section)</title>
  <div v-if="user">
    <p>Bonjour, {{ user.firstname }}</p>
    <el-button @click="authStore.logout()">Deconnexion</el-button>
  </div>
  <div v-else>
    <el-button @click="handleLogin({ email: 'client@gmail.com' })">Client</el-button>
    <el-button @click="handleLogin({ email: 'veto@gmail.com' })">Veto</el-button>
    <el-button @click="handleLogin({ email: 'directeur@gmail.com' })">Directeur</el-button>
    <el-button @click="handleLogin({ email: 'referent@gmail.com' })">Referant</el-button>
    <el-button @click="handleLogin({ email: 'admin@gmail.com' })">Admin</el-button>
  </div>
</template>

<style scoped></style>
