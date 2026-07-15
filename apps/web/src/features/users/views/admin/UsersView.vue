<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { http } from '@/lib/api'
import { useNotify } from '@/composables/useNotify'

const notify = useNotify()

interface UserRow {
  id: string
  firstname: string
  lastname: string
  email: string
  role: 'CLIENT' | 'SECRETARY' | 'DIRECTOR' | 'REFERANT' | 'VETERINARIAN' | 'ADMIN'
  createdAt: string
}

const roleLabel: Record<UserRow['role'], string> = {
  CLIENT: 'Client',
  SECRETARY: 'Secrétaire',
  DIRECTOR: 'Directeur',
  REFERANT: 'Référent',
  VETERINARIAN: 'Vétérinaire',
  ADMIN: 'Admin',
}

const roleTag: Record<UserRow['role'], string> = {
  CLIENT: '',
  SECRETARY: 'warning',
  DIRECTOR: 'danger',
  REFERANT: '',
  VETERINARIAN: 'success',
  ADMIN: 'info',
}

const users = ref<UserRow[]>([])
const loading = ref(false)
const search = ref('')

const dialog = ref<{ visible: boolean; row: UserRow | null }>({
  visible: false,
  row: null,
})
const actionLoading = ref(false)

async function load() {
  loading.value = true
  try {
    users.value = await http.get('/admin/users')
  } catch (err: unknown) {
    notify.error(err instanceof Error ? err.message : 'Erreur de chargement')
  } finally {
    loading.value = false
  }
}

function openDialog(row: UserRow) {
  dialog.value = { visible: true, row }
}

async function confirmDelete() {
  if (!dialog.value.row) return
  actionLoading.value = true
  try {
    await http.delete(`/admin/users/${dialog.value.row.id}`)
    notify.success('Compte supprimé')
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
  <div class="users-page">
    <div class="page-header">
      <h1>Comptes utilisateurs</h1>
      <p>Gérez l'ensemble des comptes de la plateforme</p>
    </div>

    <el-input
      v-model="search"
      placeholder="Rechercher par nom ou email"
      clearable
      class="search-input"
    />

    <el-table
      v-loading="loading"
      :data="
        users.filter((u) =>
          `${u.firstname} ${u.lastname} ${u.email}`.toLowerCase().includes(search.toLowerCase()),
        )
      "
      stripe
      empty-text="Aucun compte"
    >
      <el-table-column label="Nom" min-width="180">
        <template #default="{ row }">{{ row.firstname }} {{ row.lastname }}</template>
      </el-table-column>
      <el-table-column prop="email" label="Email" min-width="220" />
      <el-table-column label="Rôle" width="130">
        <template #default="{ row }: { row: UserRow }">
          <el-tag :type="roleTag[row.role] as any" size="small">{{ roleLabel[row.role] }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="Créé le" width="140">
        <template #default="{ row }">{{
          new Date(row.createdAt).toLocaleDateString('fr-FR')
        }}</template>
      </el-table-column>
      <el-table-column label="Actions" width="120" fixed="right">
        <template #default="{ row }">
          <el-button size="small" type="danger" @click="openDialog(row)">Supprimer</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialog.visible" title="Supprimer le compte" width="440px" align-center>
      <p v-if="dialog.row" class="dialog-body">
        Confirmer la suppression du compte
        <strong>{{ dialog.row.firstname }} {{ dialog.row.lastname }}</strong>
        (<em>{{ dialog.row.email }}</em>) ?<br />
        Cette action est irréversible. Si ce compte a encore des données liées (rendez-vous,
        historique médical, réunions, conversations...), la suppression sera refusée avec le
        détail des éléments bloquants.
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
.users-page {
  padding: 32px 24px;
}
.page-header {
  margin-bottom: 24px;
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
.search-input {
  max-width: 360px;
  margin-bottom: 16px;
}
.dialog-body {
  margin: 0;
  line-height: 1.7;
  color: #374151;
}
</style>
