<script lang="ts" setup>
import { useRoute } from 'vue-router'
import { usersApi } from '../api/user.api'
import ClientComponent from '../components/ClientComponent.vue'
const route = useRoute()
console.log('fetching user', route.params.id)
const user = await usersApi.get(route.params.id as string)
console.log(user)
</script>
<template>
  <ClientComponent v-if="user.role === 'CLIENT'" :client="user" />
  <div v-else>Autre rôle</div>
</template>
