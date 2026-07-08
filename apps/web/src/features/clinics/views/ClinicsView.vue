<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useNotify } from '@/composables/useNotify'
import type { Clinic } from '@armali/schemas'
import { clinicApi } from '../clinic.api'

const notify = useNotify()

const clinics = ref<Clinic[]>([])
const loading = ref(false)

const dialog = ref<{ visible: boolean; row: Clinic | null }>({
  visible: false,
  row: null,
})
const actionLoading = ref(false)

async function load() {
  loading.value = true
  try {
    clinics.value = await clinicApi.getAll()
  } catch (err: unknown) {
    notify.error(err instanceof Error ? err.message : 'Erreur de chargement')
  } finally {
    loading.value = false
  }
}

function openDialog(row: Clinic) {
  dialog.value = { visible: true, row }
}

async function confirmDelete() {
  if (!dialog.value.row) return
  actionLoading.value = true
  try {
    await clinicApi.remove({ id: dialog.value.row.id })
    notify.success('Clinique supprimée')
    dialog.value.visible = false
    await load()
  } catch (err: unknown) {
    notify.error(err instanceof Error ? err.message : 'Erreur')
  } finally {
    actionLoading.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="clinics-page">
    <div class="page-header">
      <h1>Cliniques</h1>
      <p>Gérez les cliniques enregistrées sur la plateforme</p>
    </div>

    <el-table v-loading="loading" :data="clinics" stripe empty-text="Aucune clinique">
      <el-table-column prop="name" label="Nom" min-width="160" />
      <el-table-column prop="address" label="Adresse" min-width="180" />
      <el-table-column prop="siret" label="SIRET" width="150" />
      <el-table-column prop="phone" label="Téléphone" width="140" />
      <el-table-column label="Site web" min-width="160">
        <template #default="{ row }">
          <a :href="row.website" target="_blank">{{ row.website }}</a>
        </template>
      </el-table-column>
      <el-table-column label="Actions" width="120" fixed="right">
        <template #default="{ row }">
          <el-button size="small" type="danger" @click="openDialog(row)">Supprimer</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialog.visible" title="Supprimer la clinique" width="440px" align-center>
      <p v-if="dialog.row" class="dialog-body">
        Confirmer la suppression de la clinique <strong>« {{ dialog.row.name }} »</strong> ?<br />
        Le personnel rattaché conservera son compte mais perdra son rattachement à cette clinique.
        Cette action est irréversible.
      </p>
      <template #footer>
        <el-button @click="dialog.visible = false">Annuler</el-button>
        <el-button type="danger" :loading="actionLoading" @click="confirmDelete">
          Supprimer
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.clinics-page {
  padding: 32px 24px;
}
.page-header {
  margin-bottom: 32px;
}
.page-header h1 {
  font-size: 24px;
  font-weight: 700;
  margin: 0 0 6px;
}
.page-header p {
  color: #6b7280;
  margin: 0;
}
.dialog-body {
  margin: 0;
  line-height: 1.7;
  color: #374151;
}
</style>
