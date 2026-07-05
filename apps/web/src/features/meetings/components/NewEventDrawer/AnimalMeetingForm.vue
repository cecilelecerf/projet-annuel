<script setup lang="ts">
import { computed } from 'vue'
import type { Animal, User, ClinicId, Clinic } from '@armali/schemas'
import DateField from './DateField.vue'
import SearchSelectSingle from './SearchSelectSingle.vue'
import AvailabilityTimeline from './timeline/AvailabilityTimeline.vue'

defineProps<{
  clients: User[]
  animals: Animal[]
  vets: User[]
  isVetLocked: boolean
  myClinics: Clinic[]
  showClinicSelect: boolean
}>()

const selectedClient = defineModel<User | null>('selectedClient', { required: true })
const selectAnimal = defineModel<Animal | null>('selectAnimal', { required: true })
const selectedVet = defineModel<User | null>('selectedVet', { required: true })
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

  <div v-if="showClinicSelect" class="field">
    <label class="field-label">Clinique</label>
    <el-select
      v-model="clinicId"
      placeholder="Choisir une clinique"
      size="large"
      style="width: 100%"
    >
      <el-option v-for="c in myClinics" :key="c.id" :label="c.name" :value="c.id" />
    </el-select>
  </div>

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
  <p v-else class="timeline-hint">
    Sélectionnez un véto et une clinique pour voir les disponibilités.
  </p>
</template>

<style lang="scss" scoped>
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
