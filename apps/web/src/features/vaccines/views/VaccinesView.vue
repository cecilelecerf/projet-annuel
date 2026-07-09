<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { Pet, Vaccine } from '@armali/schemas'
import { useVaccines } from '../composables/useVaccines'
import { useVaccineForm } from '../composables/useVaccineForm'
import { useVaccineFilters } from '../composables/useVaccineFilters'
import VaccinesTable from '../components/VaccinesTable.vue'
import VaccineFormDialog from '../components/VaccineFormDialog.vue'
import VaccineDeleteDialog from '../components/VaccineDeleteDialog.vue'
import { petApi } from '@/features/pets/api.ts'

const { vaccines, loading, load, createVaccine, updateVaccine, deleteVaccine } = useVaccines()
const { search, filteredVaccines } = useVaccineFilters(vaccines)
const {
  visible,
  mode,
  editingId,
  form,
  title,
  submitLabel,
  openCreate,
  openEdit,
  close,
  addRule,
  removeRule,
} = useVaccineForm()

const actionLoading = ref(false)
const pets = ref<Pet[]>([])

function petLabel(petId: string) {
  return pets.value.find((p) => p.id === petId)?.name ?? '—'
}

async function submitForm() {
  actionLoading.value = true
  try {
    if (mode.value === 'create') {
      await createVaccine(form.value)
    } else if (editingId.value) {
      await updateVaccine(editingId.value, form.value)
    }
    close()
  } finally {
    actionLoading.value = false
  }
}

const deleteDialog = ref<{ visible: boolean; vaccine: Vaccine | null }>({
  visible: false,
  vaccine: null,
})

function openDeleteDialog(vaccine: Vaccine) {
  deleteDialog.value = { visible: true, vaccine }
}

async function confirmDelete() {
  if (!deleteDialog.value.vaccine) return
  actionLoading.value = true
  try {
    await deleteVaccine(deleteDialog.value.vaccine.id)
    deleteDialog.value.visible = false
  } finally {
    actionLoading.value = false
  }
}

onMounted(async () => {
  await load()
  pets.value = await petApi.getAll()
})
</script>

<template>
  <div>
    <div class="page-header">
      <div>
        <h1>Configuration des vaccins</h1>
        <p>Gérez le catalogue de vaccins disponibles sur la plateforme</p>
      </div>
      <el-button type="primary" @click="openCreate">Nouveau vaccin</el-button>
    </div>

    <el-input v-model="search" placeholder="Rechercher un vaccin..." clearable class="search-bar" />

    <VaccinesTable
      :vaccines="filteredVaccines"
      :loading="loading"
      :pet-label="petLabel"
      @edit="openEdit"
      @delete="openDeleteDialog"
    />

    <VaccineFormDialog
      v-model:visible="visible"
      v-model:form="form"
      :title="title"
      :submit-label="submitLabel"
      :loading="actionLoading"
      @submit="submitForm"
      @add-rule="addRule"
      @remove-rule="removeRule"
    />

    <VaccineDeleteDialog
      v-model:visible="deleteDialog.visible"
      :vaccine="deleteDialog.vaccine"
      :loading="actionLoading"
      @confirm="confirmDelete"
    />
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

.search-bar {
  max-width: 320px;
  margin-bottom: var(--spacing-md);
}
</style>
