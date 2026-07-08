<script lang="ts" setup>
import { useRoute } from 'vue-router'
import { usersApi } from '../../user.api.ts'
import ClientComponent from '../../components/ClientComponent.vue'
import type { UserId } from '@armali/schemas'
const route = useRoute()
const user = await usersApi.get({ id: route.params.id as UserId })
</script>
<template>
  <ClientComponent v-if="user.role === 'CLIENT'" :client="user" />
  <div v-else>Autre rôle</div>
</template>
