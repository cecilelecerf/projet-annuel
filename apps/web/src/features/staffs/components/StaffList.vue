<script setup lang="ts">
import type { Staff } from '@armali/schemas'
import StaffCard from './StaffCard.vue'

defineProps<{
  clinicName: string
  staffs: Staff[]
  withGoToDetail?: boolean
}>()
</script>

<template>
  <div class="card">
    <h2 class="section-title">Équipe — {{ clinicName }}</h2>
    <div v-if="staffs.length === 0" class="list-empty">Aucun compte créé pour le moment.</div>
    <div v-else class="staff-list">
      <StaffCard
        v-for="member in staffs"
        :key="member.id"
        :staff="member"
        :with-press="withGoToDetail"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
.card {
  background: var(--el-bg-color);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  padding: var(--spacing-xl);
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
  display: flex;
  flex-direction: column;
  gap: 10px;
}
</style>
