<script lang="ts" setup>
import { api } from '@/lib/api'
import { veterinarianSchema } from '@armali/schemas'
import { useRouter } from 'vue-router'
import z from 'zod'
const router = useRouter()
const veterinarians = await api('/users/veterinarian').then((data) =>
  z.array(veterinarianSchema).parse(data),
)
</script>

<template>
  <div
    v-for="veto in veterinarians"
    :key="veto.id"
    @click="router.push({ name: 'Secretary.Veto.Calendar', params: { id: veto.id } })"
  >
    {{ veto.lastname }} - {{ veto.id }}
  </div>
</template>
