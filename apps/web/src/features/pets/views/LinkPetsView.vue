<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/stores/authStore'
import { useClinicPets } from '../composables/useLinkPets.ts'
import AcceptedPetsAccordion from '../components/AcceptedPetsAccordion.vue'
import AddPetSearch from '../components/AddPetsSearch.vue'
import type {
  LinkClinic,
  LinkVeterinarian,
} from '@/features/specialities/composables/useLinkSpecialities.ts'

const { user } = storeToRefs(useAuthStore())
if (!(user.value && ('clinicId' in user.value || 'clinicIds' in user.value))) throw new Error()

const data: LinkClinic | LinkVeterinarian =
  user?.value?.role === 'VETERINARIAN'
    ? { type: 'veterinarian', veterinarianId: user.value.id }
    : { type: 'clinic', clinicId: user.value.clinicId }

const {
  allPets,
  acceptedPets,
  selectedPetIds,
  racesByPet,
  loadingRaces,
  saving,
  editing,
  load,
  loadRacesForPet,
  startEdit,
  cancelEdit,
  removePet,
  addPet,
  save,
} = useClinicPets({ data })

const activeNames = ref<string[]>([])

onMounted(load)
</script>

<template>
  <div class="clinic-pets-page">
    <div class="page-header">
      <div>
        <h1>Espèces acceptées</h1>
        <p>Configurez les espèces d'animaux que vous acceptez de recevoir</p>
      </div>
      <div class="page-header-actions">
        <template v-if="!editing">
          <el-button type="primary" @click="startEdit">Modifier</el-button>
        </template>
        <template v-else>
          <el-button @click="cancelEdit">Annuler</el-button>
          <el-button type="primary" :loading="saving" @click="save">Enregistrer</el-button>
        </template>
      </div>
    </div>

    <div class="content-grid" :class="{ 'content-grid--editing': editing }">
      <div class="accordion-panel">
        <AcceptedPetsAccordion
          v-model:active-names="activeNames"
          :pets="acceptedPets"
          :races-by-pet="racesByPet"
          :loading-races="loadingRaces"
          :editing="editing"
          @expand="loadRacesForPet"
          @remove="removePet"
        />
      </div>

      <div v-if="editing" class="search-panel">
        <h3 class="search-panel-title">Ajouter une espèce</h3>
        <AddPetSearch :all-pets="allPets" :selected-pet-ids="selectedPetIds" @add="addPet" />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.clinic-pets-page {
  display: flex;
  flex-direction: column;
  min-height: 100%;
  padding: var(--spacing-xl) var(--spacing-lg);
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: var(--spacing-xl);
  gap: var(--spacing-md);
  flex-wrap: wrap;

  h1 {
    font-size: var(--fs-xl);
    font-weight: var(--fw-bold);
    margin: 0 0 var(--spacing-2xs);
  }

  p {
    color: var(--el-text-color-secondary);
    margin: 0;
  }
}

.page-header-actions {
  display: flex;
  gap: var(--spacing-sm);
}

.content-grid {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-xl);

  &--editing {
    @include above('lg') {
      grid-template-columns: 2fr 1fr;
    }
  }
}

.accordion-panel {
  min-width: 0;
}

.search-panel {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--radius-lg);
  padding: var(--spacing-md);
  background: var(--el-fill-color-light);
  align-self: start;
  position: sticky;
  top: var(--spacing-lg);
}

.search-panel-title {
  font-size: 14px;
  font-weight: var(--fw-semibold);
  margin: 0 0 var(--spacing-sm);
}
</style>
