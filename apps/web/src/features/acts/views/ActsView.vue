<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { Act } from '@armali/schemas'
import { useActs } from '../composables/useActs'
import { useActForm } from '../composables/useActForm'
import { useActFilters } from '../composables/useActFilters'
import ActsTable from '../components/ActsTable.vue'
import ActFormDialog from '../components/ActFormDialog.vue'
import ActDeleteDialog from '../components/ActDeleteDialog.vue'
import ActsSearchBar from '../components/ActsSearchBar.vue'

const { acts, loading, load, createAct, updateAct, deleteAct } = useActs()
const { search, filteredActs } = useActFilters(acts)
const {
  visible: formVisible,
  mode,
  editingId,
  form,
  title,
  submitLabel,
  openCreate,
  openEdit,
  close: closeForm,
} = useActForm()

const actionLoading = ref(false)

async function submitForm() {
  actionLoading.value = true
  try {
    if (mode.value === 'create') {
      await createAct(form.value)
    } else if (editingId.value) {
      await updateAct(editingId.value, form.value)
    }
    closeForm()
  } finally {
    actionLoading.value = false
  }
}

const deleteDialog = ref<{ visible: boolean; act: Act | null }>({
  visible: false,
  act: null,
})

function openDeleteDialog(act: Act) {
  deleteDialog.value = { visible: true, act }
}

async function confirmDelete() {
  if (!deleteDialog.value.act) return
  actionLoading.value = true
  try {
    await deleteAct(deleteDialog.value.act.id)
    deleteDialog.value.visible = false
  } finally {
    actionLoading.value = false
  }
}

onMounted(load)
</script>

<template>
  <div>
    <div class="page-header">
      <div>
        <h1>Catalogue d'actes</h1>
        <p>Gérez les actes disponibles sur la plateforme</p>
      </div>
      <el-button type="primary" @click="openCreate">Nouvel acte</el-button>
    </div>

    <ActsSearchBar v-model="search" />

    <ActsTable
      :acts="filteredActs"
      :loading="loading"
      @edit="openEdit"
      @delete="openDeleteDialog"
    />

    <ActFormDialog
      v-model:visible="formVisible"
      v-model:form="form"
      :title="title"
      :submit-label="submitLabel"
      :loading="actionLoading"
      @submit="submitForm"
    />

    <ActDeleteDialog
      v-model:visible="deleteDialog.visible"
      :act="deleteDialog.act"
      :loading="actionLoading"
      @confirm="confirmDelete"
    />
  </div>
</template>

<style scoped lang="scss">
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: var(--spacing-xl);

  h1 {
    font-size: var(--fs-4xl);
    font-weight: var(--fw-bold);
    margin: 0 0 var(--spacing-2xs);
  }

  p {
    color: var(--color-text-secondary);
    margin: 0;
  }
}
</style>
