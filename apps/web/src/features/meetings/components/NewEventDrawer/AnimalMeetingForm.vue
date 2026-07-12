<script setup lang="ts">
import { computed } from 'vue'
import type { Animal, User, ClinicId, StaffMember } from '@armali/schemas'
import DateField from './fields/DateField.vue'
import AvailabilityTimeline from './timeline/AvailabilityTimeline.vue'
import SearchSelectSingle from '../../../../components/ui/SearchSelectSingle.vue'

defineProps<{
  clients: User[]
  animals: Animal[]
  vets: StaffMember[]
  isVetLocked: boolean
}>()

const selectedClient = defineModel<User | null>('selectedClient', { required: true })
const selectAnimal = defineModel<Animal | null>('selectAnimal', { required: true })
const selectedVet = defineModel<StaffMember | null>('selectedVet', { required: true })
const clinicId = defineModel<ClinicId | undefined>('clinicId', { required: true })
const date = defineModel<Date>('date', { required: true })
const start = defineModel<string>('start', { required: true })
const end = defineModel<string>('end', { required: true })
const isTimeValid = defineModel<boolean>('isTimeValid', { default: false })

const veterinarianProfileId = computed(() => selectedVet.value?.id)
</script>

<template>
  <SearchSelectSingle
    v-model="selectedClient"
    :items="clients"
    display-key="lastname"
    secondary-key="firstname"
    placeholder="Rechercher un client..."
  />
  <SearchSelectSingle
    v-model="selectAnimal"
    :items="animals"
    display-key="name"
    placeholder="Rechercher un animal..."
  />
  <SearchSelectSingle
    v-model="selectedVet"
    :items="vets"
    display-key="lastname"
    secondary-key="firstname"
    placeholder="Rechercher un vétérinaire..."
    :locked="isVetLocked"
  />

  <DateField v-model:date="date" />

  <AvailabilityTimeline
    v-if="veterinarianProfileId && clinicId"
    v-model:start="start"
    v-model:end="end"
    v-model:is-valid="isTimeValid"
    :veterinarian-id="veterinarianProfileId"
    :clinic-id="clinicId"
    :date="date"
  />
  <p v-else class="timeline-hint">Sélectionnez un véto pour voir les disponibilités.</p>
</template>

<style scoped lang="scss">
.field {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.field-label {
  font-size: 13px;
  font-weight: var(--fw-semibold);
  color: var(--el-text-color-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.timeline-hint {
  font-size: 13px;
  color: var(--el-text-color-placeholder);
  padding: var(--spacing-md);
  text-align: center;
  border: 1px dashed var(--el-border-color);
  border-radius: var(--radius-md);
  margin: 0;
}
</style>
