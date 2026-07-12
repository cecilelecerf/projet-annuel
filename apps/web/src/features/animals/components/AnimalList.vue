<script setup lang="ts">
import type { AnimalMeta } from '@armali/schemas'
import ContactCard from '@/components/ContactCard.vue'
import { useAuthStore } from '@/stores/authStore.ts'

defineProps<{
  clinicName: string
  animals: AnimalMeta[]
  withGoToDetail?: boolean
}>()
const { user } = useAuthStore()
const metas = (animal: AnimalMeta) => {
  if (user?.role === 'CLIENT') return undefined
  const client = animal.client
  return [`${client.user.firstname} ${client.user.lastname}`, client.user.email]
}
const badge = (animal: AnimalMeta) =>
  animal.status === 'DECEASED'
    ? { label: 'Décédé', color: 'var(--el-color-info)' }
    : { label: animal.race.name }
</script>

<template>
  <div>
    <div v-if="animals.length === 0" class="list-empty">Aucun compte créé pour le moment.</div>
    <div v-else class="staff-list">
      <ContactCard
        v-for="member in animals"
        direction="column"
        :key="member.id"
        :name="member.name"
        :badge="badge(member)"
        :muted="member.status === 'DECEASED'"
        :metas="metas(member)"
        :avatar-url="member.photoUrl"
        :route="{
          name: `${user?.role.toUpperCase()}.Animals.Detail`,
          params: { id: member.id },
        }"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
.card {
  margin-top: var(--spacing-lg);
}
.list-empty {
  color: var(--el-text-color-placeholder);
  font-size: var(--fs-md);
  text-align: center;
  padding: var(--spacing-md) 0;
}
.section-title {
  font-size: var(--fs-xl);
  font-weight: var(--fw-semibold);
  margin: 0 0 var(--spacing-md);
}
.staff-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: var(--spacing-lg);
  width: 100%;
}
</style>
