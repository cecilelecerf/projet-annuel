<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Delete, Edit, Plus } from '@element-plus/icons-vue'
import type { Pet, PetId, Race } from '@armali/schemas'
import { usePetsWithRaces } from '../composables/usePetsWithRaces'
import RacesTable from '@/features/races/components/RacesTable.vue'
import PetFormDialog from '../components/PetFormDialog.vue'
import RaceFormDialog from '@/features/races/components/RaceFormDialog.vue'
import { raceApi } from '@/features/races/api'
import { useNotify } from '@/composables/useNotify'

const notify = useNotify()
const {
  pets,
  racesByPet,
  loadingRaces,
  loading,
  loadPets,
  loadRacesForPet,
  refreshRacesForPet,
  createPet,
  updatePet,
  deletePet,
} = usePetsWithRaces()

const actionLoading = ref(false)

// ── Accordéon ────────────────────────────────────────────────────────────────

const activeNames = ref<PetId | null>(null)

async function onCollapseChange(petId: PetId | null) {
  if (!petId) return
  await loadRacesForPet(petId)
}

// ── Formulaire Pet ───────────────────────────────────────────────────────────

const petDialog = ref<{
  visible: boolean
  mode: 'create' | 'edit'
  editingId: PetId | null
  form: { name: string }
}>({
  visible: false,
  mode: 'create',
  editingId: null,
  form: { name: '' },
})

function openCreatePet() {
  petDialog.value = { visible: true, mode: 'create', editingId: null, form: { name: '' } }
}

function openEditPet(pet: Pet) {
  petDialog.value = {
    visible: true,
    mode: 'edit',
    editingId: pet.id,
    form: { name: pet.name },
  }
}

async function submitPetForm() {
  actionLoading.value = true
  try {
    if (petDialog.value.mode === 'create') {
      await createPet(petDialog.value.form)
    } else if (petDialog.value.editingId) {
      await updatePet(petDialog.value.editingId, petDialog.value.form)
    }
    petDialog.value.visible = false
  } finally {
    actionLoading.value = false
  }
}

const petDeleteDialog = ref<{ visible: boolean; pet: Pet | null }>({
  visible: false,
  pet: null,
})

function openDeletePet(pet: Pet) {
  petDeleteDialog.value = { visible: true, pet }
}

async function confirmDeletePet() {
  if (!petDeleteDialog.value.pet) return
  actionLoading.value = true
  try {
    await deletePet(petDeleteDialog.value.pet.id)
    petDeleteDialog.value.visible = false
  } finally {
    actionLoading.value = false
  }
}

// ── Formulaire Race ──────────────────────────────────────────────────────────

const raceDialog = ref<{
  visible: boolean
  mode: 'create' | 'edit'
  editingId: string | null
  petId: PetId | null
  form: { name: string; petId: PetId }
}>({
  visible: false,
  mode: 'create',
  editingId: null,
  petId: null,
  form: { name: '', petId: '' as PetId },
})

function openCreateRace(petId: PetId) {
  raceDialog.value = {
    visible: true,
    mode: 'create',
    editingId: null,
    petId,
    form: { name: '', petId },
  }
}

function openEditRace(petId: PetId, race: Race) {
  raceDialog.value = {
    visible: true,
    mode: 'edit',
    editingId: race.id,
    petId,
    form: { name: race.name, petId },
  }
}

async function submitRaceForm() {
  actionLoading.value = true
  try {
    if (raceDialog.value.mode === 'create') {
      await raceApi.create(raceDialog.value.form)
      notify.success('Race créée')
    } else if (raceDialog.value.editingId) {
      await raceApi.update({ id: raceDialog.value.editingId, name: raceDialog.value.form.name })
      notify.success('Race mise à jour')
    }
    if (raceDialog.value.petId) await refreshRacesForPet(raceDialog.value.petId)
    raceDialog.value.visible = false
  } catch (err: unknown) {
    notify.error(err instanceof Error ? err.message : 'Erreur')
  } finally {
    actionLoading.value = false
  }
}

const raceDeleteDialog = ref<{ visible: boolean; petId: PetId | null; race: Race | null }>({
  visible: false,
  petId: null,
  race: null,
})

function openDeleteRace(petId: PetId, race: Race) {
  raceDeleteDialog.value = { visible: true, petId, race }
}

async function confirmDeleteRace() {
  if (!raceDeleteDialog.value.race || !raceDeleteDialog.value.petId) return
  actionLoading.value = true
  try {
    await raceApi.remove({ id: raceDeleteDialog.value.race.id })
    notify.success('Race supprimée')
    await refreshRacesForPet(raceDeleteDialog.value.petId)
    raceDeleteDialog.value.visible = false
  } catch (err: unknown) {
    notify.error(err instanceof Error ? err.message : 'Erreur')
  } finally {
    actionLoading.value = false
  }
}

onMounted(loadPets)
</script>

<template>
  <div>
    <div class="page-header">
      <div>
        <h1>Espèces & Races</h1>
        <p>Gérez le référentiel d'espèces et de races de la plateforme</p>
      </div>
      <el-button type="primary" :icon="Plus" @click="openCreatePet">Nouvelle espèce</el-button>
    </div>

    <el-collapse
      v-model="activeNames"
      @change="onCollapseChange"
      accordion
      expand-icon-position="left"
    >
      <el-collapse-item v-for="pet in pets" :key="pet.id" :name="pet.id">
        <template #title>
          <div class="pet-title">
            <div class="pet-name-root">
              <p class="pet-name">{{ pet.name }}</p>
              <p class="race-count">{{ racesByPet[pet.id]?.length ?? '…' }} race(s)</p>
            </div>
            <div>
              <el-button @click.stop="openEditPet(pet)" :icon="Edit" />
              <el-button type="danger" plain @click.stop="openDeletePet(pet)" :icon="Delete" />
            </div>
          </div>
        </template>

        <div class="pet-actions">
          <el-button
            size="small"
            type="primary"
            plain
            :icon="Plus"
            @click.stop="openCreateRace(pet.id)"
          >
            Ajouter une race
          </el-button>
        </div>

        <RacesTable
          :races="racesByPet[pet.id] ?? []"
          :loading="loadingRaces[pet.id] ?? false"
          @edit="(race) => openEditRace(pet.id, race)"
          @delete="(race) => openDeleteRace(pet.id, race)"
        />
      </el-collapse-item>
    </el-collapse>

    <p v-if="!loading && pets.length === 0" class="empty-text">Aucune espèce enregistrée</p>

    <!-- Dialogs Pet -->
    <PetFormDialog
      v-model:visible="petDialog.visible"
      v-model:form="petDialog.form"
      :title="petDialog.mode === 'create' ? 'Nouvelle espèce' : 'Modifier l\'espèce'"
      :submit-label="petDialog.mode === 'create' ? 'Créer' : 'Enregistrer'"
      :loading="actionLoading"
      @submit="submitPetForm"
    />

    <el-dialog
      v-model="petDeleteDialog.visible"
      title="Supprimer l'espèce"
      width="440px"
      align-center
    >
      <p v-if="petDeleteDialog.pet" class="dialog-body">
        Confirmer la suppression de l'espèce <strong>« {{ petDeleteDialog.pet.name }} »</strong> ?
        Toutes ses races doivent être supprimées au préalable si elles sont utilisées.
      </p>
      <template #footer>
        <el-button @click="petDeleteDialog.visible = false">Annuler</el-button>
        <el-button type="danger" :loading="actionLoading" @click="confirmDeletePet">
          Supprimer
        </el-button>
      </template>
    </el-dialog>

    <!-- Dialogs Race -->
    <RaceFormDialog
      v-model:visible="raceDialog.visible"
      v-model:form="raceDialog.form"
      :title="raceDialog.mode === 'create' ? 'Nouvelle race' : 'Modifier la race'"
      :submit-label="raceDialog.mode === 'create' ? 'Créer' : 'Enregistrer'"
      :loading="actionLoading"
      @submit="submitRaceForm"
    />

    <el-dialog
      v-model="raceDeleteDialog.visible"
      title="Supprimer la race"
      width="440px"
      align-center
    >
      <p v-if="raceDeleteDialog.race" class="dialog-body">
        Confirmer la suppression de la race <strong>« {{ raceDeleteDialog.race.name }} »</strong> ?
      </p>
      <template #footer>
        <el-button @click="raceDeleteDialog.visible = false">Annuler</el-button>
        <el-button type="danger" :loading="actionLoading" @click="confirmDeleteRace">
          Supprimer
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: var(--spacing-xl);

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
.pet-title {
  display: flex;
  width: 100%;
  justify-content: space-between;
}
.pet-name-root {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  flex: 1;
}

.pet-name {
  font-weight: var(--fw-semibold);
}

.race-count {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.pet-actions {
  display: flex;
  justify-content: flex-end;
  margin-bottom: var(--spacing-sm);
}

.dialog-body {
  margin: 0;
  line-height: 1.7;
  color: var(--el-text-color-secondary);
}

.empty-text {
  font-size: 13px;
  color: var(--el-text-color-placeholder);
  font-style: italic;
}
</style>
