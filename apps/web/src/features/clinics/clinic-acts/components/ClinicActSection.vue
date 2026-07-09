<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import type { ClinicAct, ClinicId, Act } from '@armali/schemas'
import { useClinicActs } from '../composables/useClinicActs.ts'
import { useClinicActForm } from '../composables/useClinicActForm.ts'
import { useClinicActFilters } from '../composables/useClinicActFilters.ts'
import { actApi } from '@/features/acts/act.api'
import { useNotify } from '@/composables/useNotify'
import ClinicActFormDialog from './ClinicActFormDialog.vue'
import ClinicActsTable from './ClinicActsTable.vue'

const props = defineProps<{ clinicId: ClinicId }>()

const notify = useNotify()
const { clinicActs, loading, load, createClinicAct, updateClinicAct, deleteClinicAct } =
  useClinicActs(props.clinicId)
const { search, filteredClinicActs } = useClinicActFilters(clinicActs)
const { visible, mode, editingId, form, title, submitLabel, openCreate, openEdit, close } =
  useClinicActForm()

const catalogActs = ref<Act[]>([])
const actionLoading = ref(false)
const linkedActIds = computed(() => clinicActs.value.map((ca) => ca.actId))

const editingActId = computed(() => {
  if (!editingId.value) return null
  return clinicActs.value.find((ca) => ca.actId === editingId.value)?.actId ?? null
})
async function loadCatalog() {
  try {
    catalogActs.value = await actApi.getAll()
  } catch (err: unknown) {
    notify.error(err instanceof Error ? err.message : 'Impossible de charger le catalogue')
  }
}

async function submitForm() {
  actionLoading.value = true
  try {
    if (mode.value === 'create') {
      await createClinicAct(form.value)
    } else if (editingId.value) {
      await updateClinicAct(editingId.value, form.value)
    }
    close()
  } finally {
    actionLoading.value = false
  }
}

async function handleDelete(clinicAct: ClinicAct) {
  actionLoading.value = true
  try {
    await deleteClinicAct(clinicAct.actId)
  } finally {
    actionLoading.value = false
  }
}

watch(
  () => props.clinicId,
  (id) => {
    if (id) load(id)
  },
  { immediate: true },
)

onMounted(loadCatalog)
</script>

<template>
  <div class="form-card form-card--standalone">
    <div class="card-header-row">
      <h2>Tarifs des actes</h2>
      <el-button type="primary" size="small" @click="openCreate">Ajouter un act</el-button>
    </div>

    <el-input v-model="search" placeholder="Rechercher un acte..." clearable class="search-bar" />

    <ClinicActsTable
      :clinic-acts="filteredClinicActs"
      :loading="loading"
      @edit="openEdit"
      @delete="handleDelete"
    />

    <ClinicActFormDialog
      v-model:visible="visible"
      v-model:form="form"
      :title="title"
      :submit-label="submitLabel"
      :loading="actionLoading"
      :acts="catalogActs"
      :linked-act-ids="linkedActIds"
      :editing-act-id="editingActId"
      @submit="submitForm"
    />
  </div>
</template>

<style scoped lang="scss">
.card-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.search-bar {
  max-width: 320px;
  margin-bottom: var(--spacing-md);
}
</style>
