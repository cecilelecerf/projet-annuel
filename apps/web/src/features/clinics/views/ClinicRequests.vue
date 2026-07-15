<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useNotify } from '@/composables/useNotify'
import { formatAddress } from '@/utils/clinic.utils'
import type { ClinicRequest, ClinicStatus } from '@armali/schemas'
import { clinicApi } from '@/features/clinics/clinic.api'

const notify = useNotify()
const requests = ref<ClinicRequest[]>([])
const loading = ref(false)

const dialog = ref<{ visible: boolean; type: 'approve' | 'reject'; row: ClinicRequest | null }>({
  visible: false,
  type: 'approve',
  row: null,
})
const actionLoading = ref(false)

const statusLabel: Record<
  ClinicStatus,
  { label: string; type: 'warning' | 'success' | 'danger' | 'info' }
> = {
  PENDING: { label: 'En attente', type: 'warning' },
  APPROVED: { label: 'Approuvée', type: 'success' },
  REJECTED: { label: 'Refusée', type: 'danger' },
  NONE: { label: 'Pas de demande', type: 'danger' },
}

async function load() {
  loading.value = true
  try {
    requests.value = await clinicApi.request.getAll()
  } catch (err: unknown) {
    notify.error(err instanceof Error ? err.message : 'Erreur de chargement')
  } finally {
    loading.value = false
  }
}

function openDialog(row: ClinicRequest, type: 'approve' | 'reject') {
  dialog.value = { visible: true, type, row }
}

async function confirm() {
  if (!dialog.value.row) return
  actionLoading.value = true
  const { type, row } = dialog.value
  try {
    if (type === 'approve') clinicApi.request.approve({ id: row.id })
    else if (type === 'reject') clinicApi.request.reject({ id: row.id })
    notify.success(type === 'approve' ? 'Clinique créée avec succès' : 'Demande refusée')
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
  <div class="requests-page">
    <div class="page-header">
      <h1>Demandes de création de clinique</h1>
      <p>Validez ou refusez les demandes soumises par les directeurs</p>
    </div>

    <el-table v-loading="loading" :data="requests" stripe empty-text="Aucune demande">
      <el-table-column label="Directeur" min-width="160">
        <template #default="{ row }">
          {{ row.director.user.firstname }} {{ row.director.user.lastname }}<br />
          <small style="color: #6b7280">{{ row.director.user.email }}</small>
        </template>
      </el-table-column>
      <el-table-column prop="name" label="Clinique" min-width="160" />
      <el-table-column label="Adresse" min-width="180">
        <template #default="{ row }">{{ formatAddress(row) }}</template>
      </el-table-column>
      <el-table-column prop="siret" label="SIRET" width="150" />
      <el-table-column label="Statut" width="120">
        <template #default="scope">
          <el-tag :type="statusLabel[(scope.row as ClinicRequest).status].type">
            {{ statusLabel[(scope.row as ClinicRequest).status].label }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="Date" width="110">
        <template #default="{ row }">
          {{ new Date(row.createdAt).toLocaleDateString('fr-FR') }}
        </template>
      </el-table-column>
      <el-table-column label="Actions" width="210" fixed="right">
        <template #default="{ row }">
          <div v-if="row.status === 'PENDING'" style="display: flex; gap: 6px">
            <el-button size="small" type="success" @click="openDialog(row, 'approve')"
              >Approuver</el-button
            >
            <el-button size="small" type="danger" @click="openDialog(row, 'reject')"
              >Refuser</el-button
            >
          </div>
          <span v-else style="color: #6b7280; font-size: 13px">Traitée</span>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog
      v-model="dialog.visible"
      :title="dialog.type === 'approve' ? 'Approuver la demande' : 'Refuser la demande'"
      width="440px"
      align-center
    >
      <p v-if="dialog.row" class="dialog-body">
        <template v-if="dialog.type === 'approve'">
          Confirmer la création de la clinique <strong>« {{ dialog.row.name }} »</strong> ?<br />
          Une fois approuvée, la clinique sera enregistrée dans le système.
        </template>
        <template v-else>
          Refuser la demande de création de la clinique
          <strong>« {{ dialog.row.name }} »</strong> ?<br />
          Cette action est définitive.
        </template>
      </p>
      <template #footer>
        <el-button @click="dialog.visible = false">Annuler</el-button>
        <el-button
          :type="dialog.type === 'approve' ? 'success' : 'danger'"
          :loading="actionLoading"
          @click="confirm"
        >
          {{ dialog.type === 'approve' ? 'Approuver' : 'Refuser' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.requests-page {
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
