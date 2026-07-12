<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { http } from '@/lib/api'
import { useNotify } from '@/composables/useNotify'

const notify = useNotify()

interface Speciality {
  id: string
  name: string
  description: string
}

const specialities = ref<Speciality[]>([])
const loading = ref(false)

const dialog = ref<{ visible: boolean; editing: Speciality | null }>({
  visible: false,
  editing: null,
})
const form = reactive({ name: '', description: '' })
const saving = ref(false)

const deleteDialog = ref<{ visible: boolean; row: Speciality | null }>({
  visible: false,
  row: null,
})
const deleting = ref(false)

async function load() {
  loading.value = true
  try {
    specialities.value = await http.get('/specialities')
  } catch (err: unknown) {
    notify.error(err instanceof Error ? err.message : 'Erreur de chargement')
  } finally {
    loading.value = false
  }
}

function openCreate() {
  dialog.value = { visible: true, editing: null }
  Object.assign(form, { name: '', description: '' })
}

function openEdit(row: Speciality) {
  dialog.value = { visible: true, editing: row }
  Object.assign(form, { name: row.name, description: row.description })
}

async function save() {
  if (!form.name.trim()) return notify.error('Le nom est requis')
  if (!form.description.trim()) return notify.error('La description est requise')

  saving.value = true
  try {
    if (dialog.value.editing) {
      await http.patch(`/specialities/${dialog.value.editing.id}`, form)
      notify.success('Spécialité mise à jour')
    } else {
      await http.post('/specialities', form)
      notify.success('Spécialité créée')
    }
    dialog.value.visible = false
    await load()
  } catch (err: unknown) {
    notify.error(err instanceof Error ? err.message : 'Erreur')
  } finally {
    saving.value = false
  }
}

function openDelete(row: Speciality) {
  deleteDialog.value = { visible: true, row }
}

async function confirmDelete() {
  if (!deleteDialog.value.row) return
  deleting.value = true
  try {
    await http.delete(`/specialities/${deleteDialog.value.row.id}`)
    notify.success('Spécialité supprimée')
    deleteDialog.value.visible = false
    await load()
  } catch (err: unknown) {
    notify.error(err instanceof Error ? err.message : 'Erreur')
  } finally {
    deleting.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="specialities-page">
    <div class="page-header">
      <h1>Spécialités</h1>
      <p>Gérez les spécialités disponibles pour les cliniques et vétérinaires</p>
      <el-button type="primary" @click="openCreate">Nouvelle spécialité</el-button>
    </div>

    <el-table v-loading="loading" :data="specialities" stripe empty-text="Aucune spécialité">
      <el-table-column prop="name" label="Nom" min-width="160" />
      <el-table-column prop="description" label="Description" min-width="260" />
      <el-table-column label="Actions" width="200" fixed="right">
        <template #default="{ row }">
          <div class="row-actions">
            <el-button size="small" @click="openEdit(row)">Modifier</el-button>
            <el-button size="small" type="danger" @click="openDelete(row)">Supprimer</el-button>
          </div>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog
      v-model="dialog.visible"
      :title="dialog.editing ? 'Modifier la spécialité' : 'Nouvelle spécialité'"
      width="440px"
      align-center
    >
      <el-form label-position="top">
        <el-form-item label="Nom">
          <el-input v-model="form.name" placeholder="Cardiologie" />
        </el-form-item>
        <el-form-item label="Description">
          <el-input v-model="form.description" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialog.visible = false">Annuler</el-button>
        <el-button type="primary" :loading="saving" @click="save">Enregistrer</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="deleteDialog.visible" title="Supprimer la spécialité" width="420px" align-center>
      <p v-if="deleteDialog.row" class="dialog-body">
        Confirmer la suppression de <strong>« {{ deleteDialog.row.name }} »</strong> ?
      </p>
      <template #footer>
        <el-button @click="deleteDialog.visible = false">Annuler</el-button>
        <el-button type="danger" :loading="deleting" @click="confirmDelete">Supprimer</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.specialities-page {
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
  margin: 0 0 16px;
}
.dialog-body {
  margin: 0;
  line-height: 1.7;
  color: #374151;
}
.row-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: nowrap;
}
.row-actions :deep(.el-button) {
  margin-left: 0;
}
</style>
