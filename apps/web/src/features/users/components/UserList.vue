<script lang="ts" setup>
import { http } from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'
import { veterinarianSchema } from '@armali/schemas'
import z from 'zod'
import ContactCard from '@/components/ContactCard.vue'

const { user } = useAuthStore()
const veterinarians = await http
  .get('/users/roles/veterinarian')
  .then((data) => z.array(veterinarianSchema).parse(data))
</script>

<template>
  <div class="veto-grid">
    <ContactCard
      v-for="veto in veterinarians"
      :key="veto.id"
      :name="`${veto.firstname} ${veto.lastname}`"
      :route="{ name: `${user?.role.toUpperCase()}.Veto.Calendar`, params: { id: veto.id } }"
      direction="column"
    />
  </div>
</template>

<style lang="scss" scoped>
.veto-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: var(--spacing-lg);
  width: 100%;
}
</style>
