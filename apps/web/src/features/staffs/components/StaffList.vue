<script setup lang="ts">
import type { StaffMember, StaffRole } from '@armali/schemas'
import ContactCard, { type Color } from '@/components/ContactCard.vue'
import { useAuthStore } from '@/stores/authStore.ts'

defineProps<{
  clinicName: string
  staffs: StaffMember[]
  withGoToDetail?: boolean
}>()
const { user } = useAuthStore()
const roleLabel: Record<StaffRole, string> = {
  DIRECTOR: 'Directeur',
  REFERENT: 'Référent',
  VETERINARIAN: 'Vétérinaire',
  SECRETARY: 'Secrétaire',
}
const roleTag: Record<StaffRole, Color> = {
  DIRECTOR: 'orange',
  REFERENT: 'purple',
  VETERINARIAN: 'pink',
  SECRETARY: 'teal',
}
</script>

<template>
  <div>
    <h2 class="section-title">Équipe — {{ clinicName }}</h2>
    <div v-if="staffs.length === 0" class="list-empty">Aucun compte créé pour le moment.</div>
    <div v-else class="staff-list">
      <ContactCard
        v-for="member in staffs"
        direction="column"
        :metas="[member.email]"
        :key="member.id"
        :name="member.lastname"
        :avatar-url="member.avatarUrl"
        :color="roleTag[member.role]"
        :badge="{ label: roleLabel[member.role], color: roleTag[member.role] }"
        :route="{ name: `${user?.role.toUpperCase()}.Staff.Detail`, params: { id: member.id } }"
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
