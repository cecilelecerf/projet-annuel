<script setup lang="ts">
import type { Clinic } from '@armali/schemas'
import { computed } from 'vue'
import ProfileInfoRows from './ProfileInfoRows.vue'
import { formatAddress, formatOpeningHours } from '@/utils/clinic.utils'

const props = defineProps<{
  clinic: Clinic
}>()

const rows = computed(() => {
  const r = [
    { label: 'Nom', value: props.clinic.name },
    { label: 'Adresse', value: formatAddress(props.clinic) },
    { label: 'Téléphone', value: props.clinic.phone },
    { label: 'Site web', value: props.clinic.website, isLink: true },
  ]
  if (props.clinic.description) {
    r.push({ label: 'Description', value: props.clinic.description })
  }
  if (props.clinic.openingHours) {
    r.push({ label: 'Horaires', value: formatOpeningHours(props.clinic.openingHours) })
  }
  return r
})
</script>

<template>
  <div class="card">
    <h2 class="section-title">Ma clinique — {{ clinic.name }}</h2>
    <ProfileInfoRows :rows="rows" />
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
.section-title {
  font-size: var(--fs-xl);
  font-weight: var(--fw-semibold);
  margin: 0 0 var(--spacing-md);
}
</style>
